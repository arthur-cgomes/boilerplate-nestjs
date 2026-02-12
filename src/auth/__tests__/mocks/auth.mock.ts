import { User } from '../../../user/entity/user.entity';
import {
  JwtPayload,
  JwtResponse,
} from '../../interfaces/jwt-payload.interface';
import { RefreshToken } from '../../entity/refresh-token.entity';
import { PasswordResetToken } from '../../entity/password-reset-token.entity';
import { LoginAttempt } from '../../entity/login-attempt.entity';
import { LoginResponse } from '../../interfaces/login-response.interface';

export const mockJwtPayload: JwtPayload = {
  email: 'arthur.gomes@dev.com.br',
  userId: '7ed5c779-2b02-4a29-a47d-3806930fa7b6',
  name: 'Arthur Gomes',
  userType: 'user',
};

export const mockJwtResponse: JwtResponse = {
  expiresIn: 7200,
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFydGh1ci5nb21lc0BkZXYuY29tLmJyIiwidXNlcklkIjoiN2VkNWM3NzktMmIwMi00YTI5LWE0N2QtMzgwNjkzMGZhN2I2IiwiaWF0IjoxNjkzNjY2MTc0LCJleHAiOjE2OTM2NzMzNzR9.a-XA9orqANdoGZI78IhZJiLbaj0OMK4OhSFa8-lEpSY',
  userId: '7ed5c779-2b02-4a29-a47d-3806930fa7b6',
  name: 'Arthur Gomes',
  userType: 'user',
};

export const mockUser = {
  id: '7ed5c779-2b02-4a29-a47d-3806930fa7b6',
  email: 'arthur.gomes@dev.com.br',
  name: 'Arthur Gomes',
  userType: 'user',
  checkPassword: jest.fn().mockReturnValue(true),
} as unknown as User;

export const mockUserWithInvalidPassword = {
  ...mockUser,
  checkPassword: jest.fn().mockReturnValue(false),
} as unknown as User;

export const mockLoginDto = {
  email: 'arthur.gomes@dev.com.br',
  password: 'password123',
};

export const mockLoginResponse: LoginResponse = {
  accessToken: mockJwtResponse.token,
  refreshToken: 'refresh-token-uuid',
  expiresIn: 7200,
  userId: mockUser.id,
  name: mockUser.name,
  userType: mockUser.userType,
};

export const mockRefreshToken: Partial<RefreshToken> = {
  id: 'refresh-token-id',
  token: 'refresh-token-uuid',
  userId: mockUser.id,
  user: mockUser,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revoked: false,
  sessionId: 'session-id-uuid',
  deviceInfo: 'Chrome em Windows',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
  ipAddress: '127.0.0.1',
};

export const mockPasswordResetToken: Partial<PasswordResetToken> = {
  id: 'reset-token-id',
  token: 'reset-token-uuid',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  used: false,
};

export const mockLoginAttempt: Partial<LoginAttempt> = {
  id: 'attempt-id',
  email: mockUser.email,
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  successful: false,
  createdAt: '2022-01-01T00:00:00.000Z',
};

export const mockSupabaseUser = {
  id: 'supabase-user-id',
  email: 'social@test.com',
  app_metadata: {
    provider: 'google',
  },
  user_metadata: {
    full_name: 'Social User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};
