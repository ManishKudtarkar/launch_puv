import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type TrackerRequest = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  ips?: string[];
};

const firstHeader = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/**
 * Rate-limit per real client instead of per proxy.
 *
 * In production the API sits behind Cloudflare + Render's proxy, so the socket
 * address is the proxy's — every visitor shared one bucket, and the strict
 * auth limits (e.g. forgot-password: 3 / 5 min) were exhausted platform-wide.
 *
 * Cloudflare sets `cf-connecting-ip` to the real client and overwrites any
 * value a client sends, so it's preferred. `req.ip` (resolved from
 * X-Forwarded-For via Express `trust proxy`) is the fallback, e.g. locally.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as TrackerRequest;
    const ip =
      firstHeader(request.headers['cf-connecting-ip']) ??
      firstHeader(request.headers['true-client-ip']) ??
      request.ips?.[0] ??
      request.ip ??
      'unknown';
    return Promise.resolve(ip);
  }
}
