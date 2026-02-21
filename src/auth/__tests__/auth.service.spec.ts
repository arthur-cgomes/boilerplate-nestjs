jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { EmailClientService } from '../../common/services/email-client.service';
import { LoginAttemptService } from '../services/login-attempt.service';
import { RefreshToken } from '../entity/refresh-token.entity';
import { PasswordResetToken } from '../entity/password-reset-token.entity';
import {
  MockRepository,
  repositoryMockFactory,
} from '../../common/utils/test.util';
import {
  mockUser,
  mockUserWithInvalidPassword,
  mockLoginDto,
  mockJwtPayload,
  mockJwtResponse,
  mockRefreshToken,
  mockPasswordResetToken,
} from './mocks/auth.mock';
import { SUCCESS_MESSAGES } from '../../common/constants/app.constants';

jest.mock('../../config/supabase.config', () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from '../../config/supabase.config';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    checkUserToLogin: jest.Mock;
    getUserById: jest.Mock;
    findByEmail: jest.Mock;
    updatePassword: jest.Mock;
    createOrUpdateSocialUser: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let emailClient: { sendPasswordReset: jest.Mock };
  let loginAttemptService: {
    isAccountLocked: jest.Mock;
    recordAttempt: jest.Mock;
  };
  let refreshTokenRepository: MockRepository<RefreshToken>;
  let passwordResetTokenRepository: MockRepository<PasswordResetToken>;

  beforeAll(async () => {
    userService = {
      checkUserToLogin: jest.fn(),
      getUserById: jest.fn(),
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
      createOrUpdateSocialUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue(mockJwtResponse.token),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          EXPIRE_IN: 7200,
          REFRESH_EXPIRE_IN: 604800,
          NODE_ENV: 'local',
        };
        return config[key];
      }),
    };

    emailClient = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    loginAttemptService = {
      isAccountLocked: jest.fn().mockResolvedValue({ locked: false }),
      recordAttempt: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EmailClientService, useValue: emailClient },
        { provide: LoginAttemptService, useValue: loginAttemptService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: repositoryMockFactory<RefreshToken>(),
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: repositoryMockFactory<PasswordResetToken>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    passwordResetTokenRepository = module.get(
      getRepositoryToken(PasswordResetToken),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(null);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUserByPassword', () => {
    it('Should return login response on successful login', async () => {
      userService.checkUserToLogin.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.validateUserByPassword(
        mockLoginDto,
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(loginAttemptService.isAccountLocked).toHaveBeenCalledWith(
        mockLoginDto.email,
      );
      expect(loginAttemptService.recordAttempt).toHaveBeenCalledWith(
        mockLoginDto.email,
        true,
        '127.0.0.1', // ipAddress comes before userAgent
        'Mozilla/5.0',
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('Should throw ForbiddenException when account is locked', async () => {
      loginAttemptService.isAccountLocked.mockResolvedValue({
        locked: true,
        remainingMs: 1800000,
      });

      await expect(
        service.validateUserByPassword(
          mockLoginDto,
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(userService.checkUserToLogin).not.toHaveBeenCalled();
    });

    it('Should throw ForbiddenException and record attempt when user not found', async () => {
      loginAttemptService.isAccountLocked.mockResolvedValue({ locked: false });
      userService.checkUserToLogin.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        service.validateUserByPassword(
          mockLoginDto,
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(loginAttemptService.recordAttempt).toHaveBeenCalledWith(
        mockLoginDto.email,
        false,
        '127.0.0.1', // ipAddress comes before userAgent
        'Mozilla/5.0',
      );
    });

    it('Should throw ForbiddenException and record attempt when password is invalid', async () => {
      loginAttemptService.isAccountLocked.mockResolvedValue({ locked: false });
      userService.checkUserToLogin.mockResolvedValue(
        mockUserWithInvalidPassword,
      );

      await expect(
        service.validateUserByPassword(
          mockLoginDto,
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(loginAttemptService.recordAttempt).toHaveBeenCalledWith(
        mockLoginDto.email,
        false,
        '127.0.0.1', // ipAddress comes before userAgent
        'Mozilla/5.0',
      );
    });
  });

  describe('createAuthTokens', () => {
    it('Should create access and refresh tokens', async () => {
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.createAuthTokens(
        mockUser,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        '127.0.0.1',
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        userId: mockUser.id,
        name: mockUser.name,
        userType: mockUser.userType,
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn', 7200);
    });

    it('Should parse device info from user agent with Chrome on Windows', async () => {
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.createAuthTokens(
        mockUser,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        '127.0.0.1',
      );

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Chrome em Windows',
        }),
      );
    });

    it('Should parse device info with Firefox on Linux', async () => {
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.createAuthTokens(
        mockUser,
        'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
        '127.0.0.1',
      );

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Firefox em Linux',
        }),
      );
    });

    it('Should handle unknown browser and OS', async () => {
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.createAuthTokens(mockUser, 'SomeUnknownAgent', '127.0.0.1');

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Navegador desconhecido em SO desconhecido',
        }),
      );
    });

    it('Should handle missing user agent', async () => {
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.createAuthTokens(mockUser, undefined, '127.0.0.1');

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Dispositivo desconhecido',
        }),
      );
    });

    it('Should use default expiration when config not set', async () => {
      configService.get.mockReturnValue(null);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.createAuthTokens(
        mockUser,
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(result).toHaveProperty('expiresIn', 7200);
    });
  });

  describe('refreshAccessToken', () => {
    it('Should refresh access token with valid refresh token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });
      userService.getUserById.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshAccessToken(
        'refresh-token-uuid',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        mockRefreshToken.id,
        { revoked: true },
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('Should throw UnauthorizedException when refresh token is invalid', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken('invalid-token', 'Mozilla/5.0', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('Should revoke a refresh token', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });

      await service.revokeRefreshToken('refresh-token-uuid');

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { token: 'refresh-token-uuid' },
        { revoked: true },
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('Should revoke all user tokens and return count', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.revokeAllUserTokens(mockUser.id);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revoked: false },
        { revoked: true },
      );
      expect(result).toBe(3);
    });

    it('Should return 0 when no tokens to revoke', async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.revokeAllUserTokens(mockUser.id);

      expect(result).toBe(0);
    });

    it('Should return 0 when affected is undefined', async () => {
      refreshTokenRepository.update.mockResolvedValue({});

      const result = await service.revokeAllUserTokens(mockUser.id);

      expect(result).toBe(0);
    });
  });

  describe('createJwtPayload', () => {
    it('Should create JWT payload response', async () => {
      const result = await service.createJwtPayload(mockUser);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('userId', mockUser.id);
    });
  });

  describe('validateUserByJwt', () => {
    it('Should return user payload when valid', async () => {
      userService.checkUserToLogin.mockResolvedValue(mockUser);

      const result = await service.validateUserByJwt(mockJwtPayload);

      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('userId', mockUser.id);
    });

    it('Should throw UnauthorizedException when user not found', async () => {
      userService.checkUserToLogin.mockResolvedValue(null);

      await expect(service.validateUserByJwt(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('Should return success message when user not found (security)', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset('unknown@test.com');

      expect(result).toEqual({
        message: SUCCESS_MESSAGES.AUTH.RESET_TOKEN_SENT,
      });
      expect(emailClient.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('Should create reset token and send email when user exists (local env)', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'local';
        return 7200;
      });
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 0 });
      passwordResetTokenRepository.create.mockReturnValue(
        mockPasswordResetToken,
      );
      passwordResetTokenRepository.save.mockResolvedValue(
        mockPasswordResetToken,
      );

      const result = await service.requestPasswordReset(mockUser.email);

      expect(emailClient.sendPasswordReset).toHaveBeenCalled();
      expect(result.message).toBe(SUCCESS_MESSAGES.AUTH.RESET_TOKEN_SENT);
      expect(result.token).toBeDefined();
    });

    it('Should return token in development environment', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return 7200;
      });
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 0 });
      passwordResetTokenRepository.create.mockReturnValue(
        mockPasswordResetToken,
      );
      passwordResetTokenRepository.save.mockResolvedValue(
        mockPasswordResetToken,
      );

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result.token).toBeDefined();
    });

    it('Should not return token in production', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return 7200;
      });
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 0 });
      passwordResetTokenRepository.create.mockReturnValue(
        mockPasswordResetToken,
      );
      passwordResetTokenRepository.save.mockResolvedValue(
        mockPasswordResetToken,
      );

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result.token).toBeUndefined();
    });
  });

  describe('confirmPasswordReset', () => {
    it('Should reset password with valid token', async () => {
      passwordResetTokenRepository.findOne.mockResolvedValue(
        mockPasswordResetToken,
      );
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 1 });
      userService.updatePassword.mockResolvedValue(undefined);
      refreshTokenRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.confirmPasswordReset(
        'reset-token-uuid',
        'NewPassword@123',
      );

      expect(passwordResetTokenRepository.update).toHaveBeenCalledWith(
        mockPasswordResetToken.id,
        { used: true },
      );
      expect(userService.updatePassword).toHaveBeenCalled();
      expect(result.message).toBe(SUCCESS_MESSAGES.AUTH.PASSWORD_RESET);
    });

    it('Should throw BadRequestException with invalid token', async () => {
      passwordResetTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('invalid-token', 'NewPassword@123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('loginWithSocialProvider', () => {
    it('Should throw BadRequestException when Supabase not configured', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      await expect(
        service.loginWithSocialProvider(
          'access-token',
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should throw UnauthorizedException when Supabase returns error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Invalid token'),
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      await expect(
        service.loginWithSocialProvider(
          'invalid-token',
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Should throw UnauthorizedException when no user data', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      await expect(
        service.loginWithSocialProvider(
          'invalid-token',
          'Mozilla/5.0',
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Should login successfully with valid Supabase token', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Social User' },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });

    it('Should map google provider correctly', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Social User' },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          authProvider: 'google',
        }),
      );
    });

    it('Should map azure provider to microsoft', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'azure' },
        user_metadata: { full_name: 'Social User' },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          authProvider: 'microsoft',
        }),
      );
    });

    it('Should map unknown provider to local', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'unknown' },
        user_metadata: { full_name: 'Social User' },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          authProvider: 'local',
        }),
      );
    });

    it('Should use email prefix as name when no full_name provided', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'google' },
        user_metadata: {},
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'social',
        }),
      );
    });

    it('Should use name from user_metadata when full_name not available', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'google' },
        user_metadata: { name: 'Alternative Name' },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alternative Name',
        }),
      );
    });

    it('Should use picture when avatar_url not available', async () => {
      const mockSupabaseUser = {
        id: 'supabase-id',
        email: 'social@test.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: 'Social User',
          picture: 'https://picture.url',
        },
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
          }),
        },
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
      userService.createOrUpdateSocialUser.mockResolvedValue(mockUser);
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      await service.loginWithSocialProvider(
        'valid-token',
        'Mozilla/5.0',
        '127.0.0.1',
      );

      expect(userService.createOrUpdateSocialUser).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'https://picture.url',
        }),
      );
    });
  });
});
