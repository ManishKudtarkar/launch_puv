import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Role, UserStatus, UserType } from '../../../generated/prisma/enums';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  userType: UserType;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  async createSession(userId: string, refreshToken: string, expiresAt: Date) {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    return this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  async validateSession(
    sessionId: string,
    refreshToken: string,
  ): Promise<SessionUser> {
    const session = await this.prisma.userSession.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            userType: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const providedHash = this.hashRefreshToken(refreshToken);

    if (providedHash !== session.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      userType: session.user.userType,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
  async rotateSession(
    sessionId: string,
    refreshToken: string,
    userId: string,
    newRefreshToken: string,
    expiresAt: Date,
  ) {
    await this.validateSession(sessionId, refreshToken);

    return this.prisma.$transaction(async (tx) => {
      const currentSession = await tx.userSession.findFirst({
        where: {
          id: sessionId,
          userId,
          revokedAt: null,
        },
      });

      if (!currentSession) {
        throw new UnauthorizedException('Session is no longer valid');
      }

      const newSession = await tx.userSession.create({
        data: {
          userId,
          refreshTokenHash: this.hashRefreshToken(newRefreshToken),
          expiresAt,
        },
      });

      await tx.userSession.update({
        where: {
          id: sessionId,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return newSession;
    });
  }
}
