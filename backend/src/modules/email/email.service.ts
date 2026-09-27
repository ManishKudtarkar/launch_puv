import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

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

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check mail configuration before the account lookup, so a missing SMTP
   * configuration cannot reveal whether an email address is registered.
   */
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

  private getSmtpConfiguration(): SmtpConfiguration {
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
      throw new ServiceUnavailableException(
        'Password reset email is not configured. Contact an administrator.',
      );
    }

    return {
      host,
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      user,
      password,
      from,
      frontendUrl,
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
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
