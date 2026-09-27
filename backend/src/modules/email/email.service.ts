import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import * as QRCode from 'qrcode';

type SmtpConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  frontendUrl: string;
};

@Injectable()
export class EmailService {
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) { }

  ensurePasswordResetEmailIsConfigured(): void {
    this.getSmtpConfiguration();
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const configuration = this.getSmtpConfiguration();
    const resetUrl = this.buildResetUrl(configuration.frontendUrl, token);

    await this.getTransporter(configuration).sendMail({
      from: configuration.from,
      to: email,
      subject: 'Reset your PUVerse password',
      text: [
        'We received a request to reset your PUVerse password.',
        `Reset your password: ${resetUrl}`,
        'This link expires soon. If you did not request this, you can ignore this email.',
      ].join('\n\n'),
      html: [
        '<p>We received a request to reset your PUVerse password.</p>',
        `<p><a href="${resetUrl}">Reset your password</a></p>`,
        '<p>This link expires soon. If you did not request this, you can ignore this email.</p>',
      ].join(''),
    });
  }

  // ─── TICKET CONFIRMATION EMAIL ────────────────────────────────────────────────

  async sendTicketEmail(options: {
    to: string;
    studentName: string;
    eventTitle: string;
    eventDate: Date;
    eventVenue: string | null;
    ticketToken: string;
    ticketsPageUrl: string;
  }): Promise<void> {
    const configuration = this.getSmtpConfigurationSoft();
    if (!configuration) return; // silently skip if SMTP not configured

    // Generate a real scannable QR code as a base64 PNG data URI
    const qrDataUrl = await QRCode.toDataURL(options.ticketToken, {
      errorCorrectionLevel: 'H',
      width: 280,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    });

    // Strip the data: prefix to get raw base64 for nodemailer inline attachment
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    const eventDateStr = options.eventDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const venueStr = options.eventVenue || 'Venue to be announced';

    await this.getTransporter(configuration).sendMail({
      from: configuration.from,
      to: options.to,
      subject: `Your ticket for ${options.eventTitle} — PUVerse`,
      text: [
        `Hi ${options.studentName},`,
        `You're registered for ${options.eventTitle}!`,
        `Date: ${eventDateStr}`,
        `Venue: ${venueStr}`,
        `Your ticket code: ${options.ticketToken}`,
        `Show the QR code attached to this email at the entrance for instant check-in.`,
        `View your pass online: ${options.ticketsPageUrl}`,
        `— PUVerse`,
      ].join('\n\n'),
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header strip -->
        <tr><td style="background:linear-gradient(90deg,#c2622d,#d97846);padding:20px 32px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">PUVerse · Event Ticket</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">${options.eventTitle}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 20px;font-size:15px;color:#333;">Hi <strong>${options.studentName}</strong>, you're all set!</p>

          <table cellpadding="0" cellspacing="0" style="width:100%;background:#fdf6f0;border-radius:12px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-weight:600;">📅 Date</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${eventDateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-weight:600;">📍 Venue</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${venueStr}</td>
            </tr>
          </table>

          <p style="margin:0 0 12px;font-size:14px;color:#555;text-align:center;">Present this QR code at the entrance for instant check-in:</p>
        </td></tr>

        <!-- QR Code -->
        <tr><td style="padding:0 32px 20px;" align="center">
          <div style="display:inline-block;padding:14px;background:#fff;border-radius:16px;border:1.5px solid #e8e2dc;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            <img src="cid:qr_ticket" alt="QR Ticket" width="200" height="200" style="display:block;border-radius:8px;" />
          </div>
          <p style="margin:10px 0 0;font-size:11px;font-family:monospace;color:#888;letter-spacing:0.08em;">${options.ticketToken}</p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 28px;" align="center">
          <a href="${options.ticketsPageUrl}" style="display:inline-block;padding:12px 28px;background:#c2622d;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">View My Ticket Online</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">This ticket was issued by PUVerse · Parul University Event Platform</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrBase64,
          encoding: 'base64',
          cid: 'qr_ticket', // referenced as src="cid:qr_ticket" in HTML
        },
      ],
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private getSmtpConfiguration(): SmtpConfiguration {
    const config = this.getSmtpConfigurationSoft();
    if (!config) {
      throw new ServiceUnavailableException(
        'Password reset email is not configured. Contact an administrator.',
      );
    }
    return config;
  }

  private getSmtpConfigurationSoft(): SmtpConfiguration | null {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const portValue = this.configService.get<string>('SMTP_PORT')?.trim();
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.get<string>('SMTP_FROM')?.trim();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.trim();
    const port = Number(portValue);

    if (
      !host ||
      !portValue ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !user ||
      !password ||
      !from ||
      !this.isHttpUrl(frontendUrl)
    ) {
      return null;
    }

    return {
      host,
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      user,
      password,
      from,
      frontendUrl: frontendUrl!,
    };
  }

  private getTransporter(configuration: SmtpConfiguration): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: configuration.host,
        port: configuration.port,
        secure: configuration.secure,
        auth: {
          user: configuration.user,
          pass: configuration.password,
        },
      });
    }
    return this.transporter;
  }

  private buildResetUrl(frontendUrl: string, token: string): string {
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);
    return resetUrl.toString();
  }

  private isHttpUrl(value: string | undefined): value is string {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
