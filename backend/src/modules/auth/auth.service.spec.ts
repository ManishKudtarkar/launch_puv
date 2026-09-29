import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserType } from '../../generated/prisma/enums';
import { SessionService } from './session/session.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let authService: AuthService;
  const existingUser = {
    id: 'user-1',
    fullName: 'Test User',
    email: 'test@paruluniversity.ac.in',
    passwordHash: 'hashed-password',
    role: 'PARTICIPANT',
    userType: UserType.STUDENT,
    status: 'ACTIVE',
  };

  type PrismaMock = {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    userSession: {
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  type PasswordServiceMock = {
    hash: jest.Mock;
    verify: jest.Mock;
  };

  type JwtServiceMock = {
    signAsync: jest.Mock;
  };

  type SessionServiceMock = {
    generateRefreshToken: jest.Mock;
    createSession: jest.Mock;
    validateSession: jest.Mock;
    rotateSession: jest.Mock;
    revokeSession: jest.Mock;
    revokeAllSessions: jest.Mock;
  };

  type EmailServiceMock = {
    ensurePasswordResetEmailIsConfigured: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  const prismaMock: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    userSession: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const passwordServiceMock: PasswordServiceMock = {
    hash: jest.fn<Promise<string>, [string]>(),
    verify: jest.fn<Promise<boolean>, [string, string]>(),
  };

  const jwtServiceMock: JwtServiceMock = {
    signAsync: jest.fn(),
  };

  const sessionServiceMock: SessionServiceMock = {
    generateRefreshToken: jest.fn(),
    createSession: jest.fn(),
    validateSession: jest.fn(),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  };

  const emailServiceMock: EmailServiceMock = {
    ensurePasswordResetEmailIsConfigured: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      passwordServiceMock,
      jwtServiceMock as unknown as JwtService,
      sessionServiceMock as unknown as SessionService,
      emailServiceMock as unknown as EmailService,
    );
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      passwordServiceMock.hash.mockResolvedValue('hashed-password');

      const createdAt = new Date();

      prismaMock.user.create.mockResolvedValue({
        id: 'user-1',
        fullName: 'Test User',
        email: 'test@paruluniversity.ac.in',
        passwordHash: 'hashed-password',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt,
      });

      const result = await authService.register(
        'Test User',
        'test@paruluniversity.ac.in',
        'Password123!',
        UserType.STUDENT,
      );

      expect(result.user.email).toBe('test@paruluniversity.ac.in');
      expect(result.user.fullName).toBe('Test User');
      expect(result.user.role).toBe('PARTICIPANT');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'test@paruluniversity.ac.in',
        },
      });

      expect(passwordServiceMock.hash).toHaveBeenCalledWith('Password123!');

      expect(prismaMock.user.create).toHaveBeenCalled();

      expect(result.message).toBe('Registration successful');
    });

    it('should reject duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@paruluniversity.ac.in',
      });

      await expect(
        authService.register(
          'Test User',
          'test@paruluniversity.ac.in',
          'Password123!',
          UserType.STUDENT,
        ),
      ).rejects.toThrow(new ConflictException('Email already registered'));

      expect(passwordServiceMock.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      passwordServiceMock.verify.mockResolvedValue(true);

      sessionServiceMock.generateRefreshToken.mockReturnValue(
        'test-refresh-token',
      );

      const session = {
        id: 'session-1',
        userId: 'user-1',
        refreshTokenHash: 'hashed-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      };

      sessionServiceMock.createSession.mockResolvedValue(session);

      jwtServiceMock.signAsync.mockResolvedValue('test-access-token');

      const result = await authService.login(
        'test@paruluniversity.ac.in',
        'Password123!',
      );

      expect(result.accessToken).toBe('test-access-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(result.sessionId).toBe('session-1');

      expect(result.user).toEqual({
        id: 'user-1',
        fullName: 'Test User',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        status: 'ACTIVE',
      });

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hashed-password',
        'Password123!',
      );

      expect(sessionServiceMock.generateRefreshToken).toHaveBeenCalled();

      expect(sessionServiceMock.createSession).toHaveBeenCalledWith(
        'user-1',
        'test-refresh-token',
        expect.any(Date),
      );

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        sessionId: 'session-1',
        tokenType: 'access',
      });
    });

    it('should reject unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login('unknown@paruluniversity.ac.in', 'Password123!'),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

      expect(passwordServiceMock.verify).not.toHaveBeenCalled();
      expect(sessionServiceMock.generateRefreshToken).not.toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should reject incorrect password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        authService.login('test@paruluniversity.ac.in', 'WrongPassword!'),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

      expect(sessionServiceMock.generateRefreshToken).not.toHaveBeenCalled();

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should reject inactive users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...existingUser,
        status: 'INACTIVE',
      });

      await expect(
        authService.login('test@paruluniversity.ac.in', 'Password123!'),
      ).rejects.toThrow(
        new UnauthorizedException('User account is not active'),
      );

      expect(passwordServiceMock.verify).not.toHaveBeenCalled();
      expect(sessionServiceMock.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh session and issue a new access token', async () => {
      sessionServiceMock.validateSession.mockResolvedValue({
        id: 'user-1',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
      });

      sessionServiceMock.generateRefreshToken.mockReturnValue(
        'new-refresh-token',
      );

      sessionServiceMock.rotateSession.mockResolvedValue({
        id: 'new-session-1',
        userId: 'user-1',
      });

      jwtServiceMock.signAsync.mockResolvedValue('new-access-token');

      const result = await authService.refresh(
        'session-1',
        'old-refresh-token',
      );

      expect(result).toEqual({
        message: 'Token refreshed successfully',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        sessionId: 'new-session-1',
      });

      expect(sessionServiceMock.validateSession).toHaveBeenCalledWith(
        'session-1',
        'old-refresh-token',
      );

      expect(sessionServiceMock.rotateSession).toHaveBeenCalledWith(
        'session-1',
        'old-refresh-token',
        'user-1',
        'new-refresh-token',
        expect.any(Date),
      );

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        sessionId: 'new-session-1',
        tokenType: 'access',
      });
    });
  });

  describe('logout', () => {
    it('should revoke the current session', async () => {
      sessionServiceMock.revokeSession.mockResolvedValue(undefined);

      const result = await authService.logout('session-1');

      expect(sessionServiceMock.revokeSession).toHaveBeenCalledWith(
        'session-1',
      );

      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions for the user', async () => {
      sessionServiceMock.revokeAllSessions.mockResolvedValue(undefined);

      const result = await authService.logoutAll('user-1');

      expect(sessionServiceMock.revokeAllSessions).toHaveBeenCalledWith(
        'user-1',
      );

      expect(result).toEqual({
        message: 'Logged out from all sessions successfully',
      });
    });
  });

  describe('changePassword', () => {
    it('should change password and revoke all sessions', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...existingUser,
      });

      passwordServiceMock.verify.mockResolvedValue(true);

      passwordServiceMock.hash.mockResolvedValue('new-hashed-password');

      prismaMock.user.update.mockResolvedValue({
        ...existingUser,
        passwordHash: 'new-hashed-password',
      });

      const result = await authService.changePassword(
        'user-1',
        'OldPassword123!',
        'NewPassword123!',
      );

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hashed-password',
        'OldPassword123!',
      );

      expect(passwordServiceMock.hash).toHaveBeenCalledWith('NewPassword123!');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        data: {
          passwordHash: 'new-hashed-password',
          mustChangePassword: false,
        },
      });

      expect(sessionServiceMock.revokeAllSessions).toHaveBeenCalledWith(
        'user-1',
      );

      expect(result).toEqual({
        message: 'Password changed successfully. Please login again.',
      });
    });
  });

  describe('forgotPassword', () => {
    it('creates a hashed, expiring token and emails the raw token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@paruluniversity.ac.in',
        status: 'ACTIVE',
      });
      prismaMock.passwordResetToken.updateMany.mockReturnValue({});
      prismaMock.passwordResetToken.create.mockReturnValue({});
      prismaMock.$transaction.mockResolvedValue([]);

      const result = await authService.forgotPassword(
        'test@paruluniversity.ac.in',
      );

      expect(
        emailServiceMock.ensurePasswordResetEmailIsConfigured,
      ).toHaveBeenCalled();
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@paruluniversity.ac.in',
        expect.stringMatching(/^[a-f0-9]{64}$/),
      );

      const createCall = prismaMock.passwordResetToken.create.mock.calls[0] as [
        { data: { tokenHash: string } },
      ];
      const storedTokenHash = createCall[0].data.tokenHash;
      const sendCall = emailServiceMock.sendPasswordResetEmail.mock
        .calls[0] as [string, string];
      const emailedToken = sendCall[1];
      expect(storedTokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(storedTokenHash).not.toBe(emailedToken);

      expect(result).toEqual({
        message:
          'If an active account exists for this email, a password-reset link has been sent.',
      });
    });

    it('does not disclose an unknown email address or send an email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await authService.forgotPassword(
        'unknown@paruluniversity.ac.in',
      );

      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'If an active account exists for this email, a password-reset link has been sent.',
      });
    });
  });

  describe('resetPassword', () => {
    it('redeems a valid token once, changes the password, and revokes sessions', async () => {
      const transactionMock = {
        passwordResetToken: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'reset-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000),
            usedAt: null,
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        user: {
          update: jest.fn().mockResolvedValue({}),
        },
        userSession: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      prismaMock.$transaction.mockImplementation(
        (operation: (tx: typeof transactionMock) => Promise<unknown>) =>
          operation(transactionMock),
      );
      passwordServiceMock.hash.mockResolvedValue('new-hashed-password');

      const result = await authService.resetPassword(
        'a'.repeat(64),
        'NewPassword123!',
      );

      expect(passwordServiceMock.hash).toHaveBeenCalledWith('NewPassword123!');
      const updateManyArg = (
        transactionMock.passwordResetToken.updateMany.mock.calls[0] as [
          { where: { id: string; usedAt: null } },
        ]
      )[0];
      expect(updateManyArg.where.id).toBe('reset-1');
      expect(updateManyArg.where.usedAt).toBeNull();
      expect(transactionMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'new-hashed-password',
          mustChangePassword: false,
        },
      });
      expect(transactionMock.userSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', revokedAt: null },
        }),
      );
      expect(result).toEqual({
        success: true,
        message: 'Password updated successfully.',
      });
    });

    it('rejects an expired reset token', async () => {
      const transactionMock = {
        passwordResetToken: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'reset-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 60_000),
            usedAt: null,
          }),
        },
      };
      prismaMock.$transaction.mockImplementation(
        (operation: (tx: typeof transactionMock) => Promise<unknown>) =>
          operation(transactionMock),
      );
      passwordServiceMock.hash.mockResolvedValue('new-hashed-password');

      await expect(
        authService.resetPassword('a'.repeat(64), 'NewPassword123!'),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired password reset token.'),
      );
    });
  });
});
