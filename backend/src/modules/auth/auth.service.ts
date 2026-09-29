import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PasswordService } from './password/password.service';
import { SessionService } from './session/session.service';
import { Role, UserStatus } from '../../generated/prisma/enums';
import { JwtPayload } from './types/jwt-payload.type';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

  async register(
    fullName: string,
    email: string,
    password: string,
    userType: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        userType: userType as never,
        role: Role.PARTICIPANT,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userType: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      message: 'Registration successful',
      user,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const passwordValid = await this.passwordService.verify(
      user.passwordHash,
      password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const refreshToken = this.sessionService.generateRefreshToken();

    const refreshExpiresAt = this.calculateExpiry(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );

    const session = await this.sessionService.createSession(
      user.id,
      refreshToken,
      refreshExpiresAt,
    );

    const payload: JwtPayload = {
      sub: user.id,
      sessionId: session.id,
      tokenType: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        userType: user.userType,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async refresh(sessionId: string, refreshToken: string) {
    const user = await this.sessionService.validateSession(
      sessionId,
      refreshToken,
    );

    const newRefreshToken = this.sessionService.generateRefreshToken();

    const newRefreshExpiresAt = this.calculateExpiry(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );

    const newSession = await this.sessionService.rotateSession(
      sessionId,
      refreshToken,
      user.id,
      newRefreshToken,
      newRefreshExpiresAt,
    );

    const payload: JwtPayload = {
      sub: user.id,
      sessionId: newSession.id,
      tokenType: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: newSession.id,
    };
  }

  async logout(sessionId: string) {
    await this.sessionService.revokeSession(sessionId);

    return {
      message: 'Logged out successfully',
    };
  }

  async logoutAll(userId: string) {
    await this.sessionService.revokeAllSessions(userId);

    return {
      message: 'Logged out from all sessions successfully',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const validPassword = await this.passwordService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    await this.sessionService.revokeAllSessions(userId);

    return {
      message: 'Password changed successfully. Please login again.',
    };
  }

  async forgotPassword(email: string) {
    // Validate SMTP before the account lookup so a missing configuration cannot
    // be used to discover which email addresses are registered.
    this.emailService.ensurePasswordResetEmailIsConfigured();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    const message =
      'If an active account exists for this email, a password-reset link has been sent.';

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { message };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(token);
    const now = new Date();
    const expiresAt = this.calculateExpiry(
      process.env.PASSWORD_RESET_TOKEN_TTL ?? '15m',
    );

    // A new request invalidates every older unused link for this user.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      // Logged in EmailService; still return the generic message so SMTP
      // failures can't be used to discover which emails are registered.
      console.error('❌ Reset Email Error:', error);
    }

    return { message };
  }

  async resetPassword(token: string, newPassword: string, email?: string) {
    const tokenHash = this.hashPasswordResetToken(token);
    const now = new Date();
    // 400 (not 401): the frontend treats 401 as "session expired" and would
    // redirect to /login instead of showing this message.
    const invalid = () =>
      new BadRequestException('Invalid or expired password reset token.');

    await this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
          user: { select: { email: true } },
        },
      });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
        throw invalid();
      }

      // If the link carried an email, it must belong to the token's owner.
      if (
        email &&
        resetToken.user.email.toLowerCase() !== email.trim().toLowerCase()
      ) {
        throw invalid();
      }

      // Avoid expensive password hashing for invalid reset links. The token is
      // checked again by the conditional update below before any data changes.
      const newPasswordHash = await this.passwordService.hash(newPassword);

      // This conditional update makes a token single-use even if two requests
      // arrive at nearly the same time.
      const redemption = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (redemption.count !== 1) {
        throw invalid();
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      await tx.userSession.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return resetToken;
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(
        'Invalid token expiration format. Use formats like 15m, 1h, 7d.',
      );
    }

    const value = Number(match[1]);
    const unit = match[2];

    let milliseconds: number;

    switch (unit) {
      case 's':
        milliseconds = 1000;
        break;

      case 'm':
        milliseconds = 60 * 1000;
        break;

      case 'h':
        milliseconds = 60 * 60 * 1000;
        break;

      case 'd':
        milliseconds = 24 * 60 * 60 * 1000;
        break;

      default:
        throw new Error('Invalid token expiration unit');
    }

    return new Date(Date.now() + value * milliseconds);
  }
}
