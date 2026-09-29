import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
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
export class EmailService implements OnModuleInit {
  private transporter?: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) { }

  // Verify SMTP connectivity once at startup so credential/port problems
  // (e.g. a bad Gmail App Password, wrong 465/587 setting) surface in the
  // terminal immediately instead of silently failing on the first email.
  async onModuleInit(): Promise<void> {
    const configuration = this.getSmtpConfigurationSoft();
    if (!configuration) {
      this.logger.warn(
        '✉️  SMTP is not fully configured — registration/ticket emails will be skipped.',
      );
      return;
    }
    try {
      await this.getTransporter(configuration).verify();
      this.logger.log(
        `✅ SMTP connection verified (${configuration.host}:${configuration.port}, secure=${configuration.secure}).`,
      );
    } catch (error) {
      console.error('❌ [SMTP Verify Error]:', error);
      this.logger.error(
        '❌ SMTP verification failed — check SMTP_USER / SMTP_PASSWORD (Google App Password) and SMTP_PORT/SMTP_SECURE (465=SSL, 587=TLS).',
      );
    }
  }

  ensurePasswordResetEmailIsConfigured(): void {
    this.getSmtpConfiguration();
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const configuration = this.getSmtpConfiguration();
    const resetUrl = this.buildResetUrl(
      configuration.frontendUrl,
      token,
      email,
    );
    const expiresIn = this.describeResetTtl();

    try {
      await this.getTransporter(configuration).sendMail({
        from: configuration.from,
        to: email,
        subject: 'Reset Your Password - PUVerse',
        text: [
          'We received a request to reset the password for your PUVerse account.',
          `Reset your password here: ${resetUrl}`,
          `For your security, this link expires in ${expiresIn} and can only be used once.`,
          "If you didn't request a password reset, you can safely ignore this email — your password will not change.",
          '— PUVerse',
        ].join('\n\n'),
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(90deg,#c2622d,#d97846);padding:20px 32px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">PUVerse · Account Security</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">Reset your password</h1>
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">We received a request to reset the password for your PUVerse account. Click the button below to choose a new password.</p>
        </td></tr>
        <tr><td style="padding:4px 32px 24px;" align="center">
          <a href="${resetUrl}" style="display:inline-block;padding:13px 32px;background:#c2622d;color:#fff;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">Reset Password</a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <div style="background:#fff8ef;border:1px solid #f0d9c4;border-radius:12px;padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#8a5a2b;line-height:1.6;">🔒 For your security, this link expires in <strong>${expiresIn}</strong> and can only be used once. If you didn't request this, you can ignore this email — your password won't change.</p>
          </div>
          <p style="margin:18px 0 0;font-size:12px;color:#999;line-height:1.6;word-break:break-all;">Button not working? Paste this link into your browser:<br><a href="${resetUrl}" style="color:#c2622d;">${resetUrl}</a></p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">PUVerse · Parul University Event Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      this.logger.log(`🔑 Password reset email sent to ${email}.`);
    } catch (error) {
      console.error('❌ Reset Email Error:', error);
      throw error;
    }
  }

  /** Human-readable form of PASSWORD_RESET_TOKEN_TTL (e.g. "15m" → "15 minutes"). */
  private describeResetTtl(): string {
    const raw = (
      this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL') ?? '15m'
    ).trim();
    const match = /^(\d+)\s*([smhd])$/i.exec(raw);
    if (!match) return '15 minutes';
    const value = Number(match[1]);
    const unit = { s: 'second', m: 'minute', h: 'hour', d: 'day' }[
      match[2].toLowerCase() as 's' | 'm' | 'h' | 'd'
    ];
    return `${value} ${unit}${value === 1 ? '' : 's'}`;
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
  }): Promise<boolean> {
    const configuration = this.getSmtpConfigurationSoft();
    if (!configuration) {
      this.logger.warn(
        `✉️  Skipping ticket email to ${options.to} — SMTP not configured.`,
      );
      return false;
    }

    try {
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

      this.logger.log(
        `🎫 Ticket email sent to ${options.to} for "${options.eventTitle}".`,
      );
      return true;
    } catch (error) {
      console.error('❌ [Registration Email Error]:', error);
      this.logger.error(
        `❌ Failed to send ticket email to ${options.to} for "${options.eventTitle}".`,
      );
      return false;
    }
  }

  // ─── REGISTRATION PENDING / LOCKED-TICKET NOTICE ──────────────────────────────
  // Sent immediately for HOURS_BEFORE / CUSTOM_TIME modes to acknowledge the
  // registration while the QR pass stays locked until its release time.
  async sendRegistrationPendingEmail(options: {
    to: string;
    studentName: string;
    eventTitle: string;
    eventDate: Date;
    eventVenue: string | null;
    releaseNote: string;
    ticketsPageUrl: string;
  }): Promise<boolean> {
    const configuration = this.getSmtpConfigurationSoft();
    if (!configuration) {
      this.logger.warn(
        `✉️  Skipping registration-pending email to ${options.to} — SMTP not configured.`,
      );
      return false;
    }

    const eventDateStr = options.eventDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const venueStr = options.eventVenue || 'Venue to be announced';

    try {
      await this.getTransporter(configuration).sendMail({
        from: configuration.from,
        to: options.to,
        subject: `Registration confirmed for ${options.eventTitle} — PUVerse`,
        text: [
          `Hi ${options.studentName},`,
          `Your registration for ${options.eventTitle} is confirmed.`,
          `Date: ${eventDateStr}`,
          `Venue: ${venueStr}`,
          options.releaseNote,
          `You can view your pass status here: ${options.ticketsPageUrl}`,
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
        <tr><td style="background:linear-gradient(90deg,#c2622d,#d97846);padding:20px 32px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">PUVerse · Registration Confirmed</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">${options.eventTitle}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 20px;font-size:15px;color:#333;">Hi <strong>${options.studentName}</strong>, you're registered!</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;background:#fdf6f0;border-radius:12px;padding:16px;margin-bottom:20px;">
            <tr>
              <td style="padding:4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-weight:600;">📅 Date</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${eventDateStr}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-weight:600;">📍 Venue</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${venueStr}</td>
            </tr>
          </table>
          <div style="background:#fff8ef;border:1px solid #f0d9c4;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#8a5a2b;line-height:1.6;">🔒 ${options.releaseNote}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 28px;" align="center">
          <a href="${options.ticketsPageUrl}" style="display:inline-block;padding:12px 28px;background:#c2622d;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">View Pass Status</a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">This message was issued by PUVerse · Parul University Event Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      this.logger.log(
        `📩 Registration-pending email sent to ${options.to} for "${options.eventTitle}".`,
      );
      return true;
    } catch (error) {
      console.error('❌ [Registration Email Error]:', error);
      this.logger.error(
        `❌ Failed to send registration-pending email to ${options.to} for "${options.eventTitle}".`,
      );
      return false;
    }
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
      frontendUrl: frontendUrl,
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

  private buildResetUrl(
    frontendUrl: string,
    token: string,
    email: string,
  ): string {
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);
    resetUrl.searchParams.set('email', email); // URLSearchParams encodes it
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

