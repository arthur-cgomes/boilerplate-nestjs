import { User } from '../../entity/user.entity';
import { AuthProvider } from '../../../common/enum/auth-provider.enum';
import { UserType } from '../../../common/enum/user-type.enum';

export const mockUser = {
  id: 'user-uuid-1',
  email: 'user@test.com',
  password: 'hashedPassword123',
  name: 'Test User',
  userType: UserType.USER,
  authProvider: AuthProvider.LOCAL,
  providerId: null,
  avatarUrl: null,
  firstLogin: null,
  lastLogin: null,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deleteAt: null,
  createdBy: null,
  createdById: null,
  updatedBy: null,
  updatedById: null,
  save: jest.fn(),
} as unknown as User;

export const mockUserWithFirstLogin = {
  ...mockUser,
  id: 'user-uuid-2',
  firstLogin: new Date('2024-01-01'),
} as unknown as User;

export const mockUserInactive = {
  ...mockUser,
  id: 'user-uuid-3',
  active: false,
  deleteAt: '2024-01-02T00:00:00.000Z',
} as unknown as User;

export const mockUserWithSocialProvider = {
  ...mockUser,
  id: 'user-uuid-4',
  email: 'social@test.com',
  authProvider: AuthProvider.GOOGLE,
  providerId: 'google-provider-id',
  avatarUrl: 'https://example.com/avatar.jpg',
} as unknown as User;

export const mockCreateUserDto = {
  email: 'new@test.com',
  password: 'Password123!',
  name: 'New User',
  createdBy: 'Admin',
  createdById: 'admin-uuid',
  userType: UserType.USER,
};

export const mockUpdateUserDto = {
  name: 'Updated User',
  email: 'updated@test.com',
};

export const mockSocialUserData = {
  email: 'social@test.com',
  name: 'Social User',
  providerId: 'provider-123',
  authProvider: AuthProvider.GOOGLE,
  avatarUrl: 'https://example.com/avatar.jpg',
};
