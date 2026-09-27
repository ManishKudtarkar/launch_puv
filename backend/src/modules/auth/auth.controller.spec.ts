import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from '../../generated/prisma/enums';
import type { AuthenticatedUser } from './types/authenticated-user.type';

describe('AuthController', () => {
  let authController: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    authController = new AuthController(
      authServiceMock as unknown as AuthService,
    );
  });

  describe('register', () => {
    it('should call AuthService.register with the registration DTO', async () => {
      const registerDto = {
        fullName: 'Test User',
        email: 'test@paruluniversity.ac.in',
        password: 'Password123!',
        userType: UserType.STUDENT,
      };

      const expectedResult = {
        message: 'Registration successful',
        user: {
          id: 'user-1',
          fullName: 'Test User',
          email: 'test@paruluniversity.ac.in',
          role: 'PARTICIPANT',
          userType: UserType.STUDENT,
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      };

      authServiceMock.register.mockResolvedValue(expectedResult);

      const result = await authController.register(registerDto);

      expect(authServiceMock.register).toHaveBeenCalledWith(
        registerDto.fullName,
        registerDto.email,
        registerDto.password,
        registerDto.userType,
      );

      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call AuthService.login with the login DTO', async () => {
      const loginDto = {
        email: 'test@paruluniversity.ac.in',
        password: 'Password123!',
      };

      const expectedResult = {
        message: 'Login successful',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        sessionId: 'session-1',
        user: {
          id: 'user-1',
          fullName: 'Test User',
          email: 'test@paruluniversity.ac.in',
          role: 'PARTICIPANT',
          userType: UserType.STUDENT,
          status: 'ACTIVE',
        },
      };

      authServiceMock.login.mockResolvedValue(expectedResult);

      const result = await authController.login(loginDto);

      expect(authServiceMock.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );

      expect(result).toEqual(expectedResult);
    });
  });

  describe('me', () => {
    it('should return the authenticated user', () => {
      const user: AuthenticatedUser = {
        userId: 'user-1',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        sessionId: 'test-session-id',
      };

      const result = authController.me(user);

      expect(result).toEqual(user);
    });
  });

  describe('refresh', () => {
    it('should call AuthService.refresh with session and refresh token', async () => {
      const refreshDto = {
        sessionId: 'session-1',
        refreshToken: 'test-refresh-token',
      };

      const expectedResult = {
        message: 'Token refreshed successfully',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        sessionId: 'new-session-1',
      };

      authServiceMock.refresh.mockResolvedValue(expectedResult);

      const result = await authController.refresh(refreshDto);

      expect(authServiceMock.refresh).toHaveBeenCalledWith(
        refreshDto.sessionId,
        refreshDto.refreshToken,
      );

      expect(result).toEqual(expectedResult);
    });
  });

  describe('forgotPassword', () => {
    it('should pass the email to AuthService', async () => {
      const dto = { email: 'test@paruluniversity.ac.in' };
      const expectedResult = {
        message:
          'If an active account exists for this email, a password-reset link has been sent.',
      };
      authServiceMock.forgotPassword.mockResolvedValue(expectedResult);

      const result = await authController.forgotPassword(dto);

      expect(authServiceMock.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should pass the token and new password to AuthService', async () => {
      const dto = {
        token: 'a'.repeat(64),
        newPassword: 'NewPassword123!',
      };
      const expectedResult = {
        message: 'Password reset successfully. Please login again.',
      };
      authServiceMock.resetPassword.mockResolvedValue(expectedResult);

      const result = await authController.resetPassword(dto);

      expect(authServiceMock.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call AuthService.logout with the current session ID', async () => {
      const user: AuthenticatedUser = {
        userId: 'user-1',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        sessionId: 'session-1',
      };

      const expectedResult = {
        message: 'Logged out successfully',
      };

      authServiceMock.logout.mockResolvedValue(expectedResult);

      const result = await authController.logout(user);

      expect(authServiceMock.logout).toHaveBeenCalledWith(user.sessionId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('logoutAll', () => {
    it('should call AuthService.logoutAll with the authenticated user ID', async () => {
      const user: AuthenticatedUser = {
        userId: 'user-1',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        sessionId: 'session-1',
      };

      const expectedResult = {
        message: 'Logged out from all sessions successfully',
      };

      authServiceMock.logoutAll.mockResolvedValue(expectedResult);

      const result = await authController.logoutAll(user);

      expect(authServiceMock.logoutAll).toHaveBeenCalledWith(user.userId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePassword', () => {
    it('should call AuthService.changePassword with authenticated user ID and passwords', async () => {
      const user: AuthenticatedUser = {
        userId: 'user-1',
        email: 'test@paruluniversity.ac.in',
        role: 'PARTICIPANT',
        userType: UserType.STUDENT,
        sessionId: 'session-1',
      };

      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      const expectedResult = {
        message: 'Password changed successfully. Please login again.',
      };

      authServiceMock.changePassword.mockResolvedValue(expectedResult);

      const result = await authController.changePassword(
        user,
        changePasswordDto,
      );

      expect(authServiceMock.changePassword).toHaveBeenCalledWith(
        user.userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      expect(result).toEqual(expectedResult);
    });
  });
});
