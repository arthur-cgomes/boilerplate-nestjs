jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { User } from '../entity/user.entity';
import {
  MockRepository,
  MockCacheManager,
  repositoryMockFactory,
  cacheManagerMockFactory,
} from '../../common/utils/test.util';
import {
  mockUser,
  mockUserWithFirstLogin,
  mockUserInactive,
  mockUserWithSocialProvider,
  mockCreateUserDto,
  mockUpdateUserDto,
  mockSocialUserData,
} from './mocks/user.mock';

describe('UserService', () => {
  let service: UserService;
  let repositoryMock: MockRepository<User>;

  let cacheManagerMock: MockCacheManager;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: repositoryMockFactory<User>(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMockFactory(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repositoryMock = module.get(getRepositoryToken(User));
    cacheManagerMock = module.get(CACHE_MANAGER);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUserToLogin', () => {
    it('Should return user and update login timestamps', async () => {
      repositoryMock.findOne
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ ...mockUser, firstLogin: null });
      repositoryMock.update.mockResolvedValue({ affected: 1 });

      const result = await service.checkUserToLogin(mockUser.email);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email, active: true },
        select: ['id', 'email', 'password', 'name', 'userType'],
      });
      expect(repositoryMock.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
      expect(result.email).toBe(mockUser.email);
    });

    it('Should set firstLogin on first login', async () => {
      const userWithoutFirstLogin = { ...mockUser, firstLogin: null };
      repositoryMock.findOne
        .mockResolvedValueOnce({ ...userWithoutFirstLogin })
        .mockResolvedValueOnce({ ...userWithoutFirstLogin });
      repositoryMock.update.mockResolvedValue({ affected: 1 });

      await service.checkUserToLogin(mockUser.email);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          lastLogin: expect.any(Date),
          firstLogin: expect.any(Date),
        }),
      );
    });

    it('Should not set firstLogin if already set', async () => {
      repositoryMock.findOne
        .mockResolvedValueOnce({ ...mockUserWithFirstLogin })
        .mockResolvedValueOnce({ ...mockUserWithFirstLogin });
      repositoryMock.update.mockResolvedValue({ affected: 1 });

      await service.checkUserToLogin(mockUserWithFirstLogin.email);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        mockUserWithFirstLogin.id,
        { lastLogin: expect.any(Date) },
      );
    });

    it('Should throw NotFoundException when user not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.checkUserToLogin('nonexistent@test.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('Should return user by email from database and cache it', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email, active: true },
      });
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
        mockUser,
        60000,
      );
      expect(result).toEqual(mockUser);
    });

    it('Should return user from cache when available', async () => {
      cacheManagerMock.get.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
      expect(repositoryMock.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('Should return null when user not found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@test.com');

      expect(result).toBeNull();
      expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });
  });

  describe('findByProviderId', () => {
    it('Should return user by providerId', async () => {
      repositoryMock.findOne.mockResolvedValue(mockUserWithSocialProvider);

      const result = await service.findByProviderId('google-provider-id');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { providerId: 'google-provider-id', active: true },
      });
      expect(result).toEqual(mockUserWithSocialProvider);
    });

    it('Should return null when provider not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findByProviderId('nonexistent-provider');

      expect(result).toBeNull();
    });
  });

  describe('createOrUpdateSocialUser', () => {
    it('Should update existing user found by providerId', async () => {
      const existingUser = { ...mockUserWithSocialProvider, firstLogin: null };
      repositoryMock.findOne.mockResolvedValue({ ...existingUser });
      repositoryMock.save.mockResolvedValue({
        ...existingUser,
        lastLogin: new Date(),
      });

      const result = await service.createOrUpdateSocialUser(mockSocialUserData);

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('Should update existing user found by email (no providerId)', async () => {
      repositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, firstLogin: null });

      repositoryMock.save.mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const result = await service.createOrUpdateSocialUser(mockSocialUserData);

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('Should create new user when no existing user found', async () => {
      repositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repositoryMock.create.mockReturnValue({ ...mockUser, save: jest.fn() });
      repositoryMock.save.mockResolvedValue(mockUser);

      const result = await service.createOrUpdateSocialUser(mockSocialUserData);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockSocialUserData.email,
          name: mockSocialUserData.name,
          providerId: mockSocialUserData.providerId,
          authProvider: mockSocialUserData.authProvider,
        }),
      );
      expect(result).toBeDefined();
    });

    it('Should create new user with null avatarUrl when not provided', async () => {
      repositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      repositoryMock.create.mockReturnValue({ ...mockUser, save: jest.fn() });
      repositoryMock.save.mockResolvedValue(mockUser);

      await service.createOrUpdateSocialUser({
        ...mockSocialUserData,
        avatarUrl: undefined,
      });

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: null,
        }),
      );
    });

    it('Should not update avatarUrl if not provided', async () => {
      const existingUser = { ...mockUserWithSocialProvider };
      repositoryMock.findOne.mockResolvedValue({ ...existingUser });
      repositoryMock.save.mockResolvedValue(existingUser);

      await service.createOrUpdateSocialUser({
        ...mockSocialUserData,
        avatarUrl: undefined,
      });

      const savedUser = repositoryMock.save.mock.calls[0][0];
      expect(savedUser.avatarUrl).toBe(mockUserWithSocialProvider.avatarUrl);
    });

    it('Should set firstLogin on first social login for existing user by email', async () => {
      const userWithoutFirstLogin = { ...mockUser, firstLogin: null };
      repositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...userWithoutFirstLogin });
      repositoryMock.save.mockResolvedValue({
        ...userWithoutFirstLogin,
        firstLogin: new Date(),
      });

      await service.createOrUpdateSocialUser(mockSocialUserData);

      const savedUser = repositoryMock.save.mock.calls[0][0];
      expect(savedUser.firstLogin).toBeDefined();
    });

    it('Should not override existing firstLogin for user found by providerId', async () => {
      const userWithFirstLogin = {
        ...mockUserWithSocialProvider,
        firstLogin: new Date('2024-01-01'),
      };
      repositoryMock.findOne.mockResolvedValue({ ...userWithFirstLogin });
      repositoryMock.save.mockResolvedValue(userWithFirstLogin);

      await service.createOrUpdateSocialUser(mockSocialUserData);

      const savedUser = repositoryMock.save.mock.calls[0][0];
      expect(savedUser.firstLogin).toEqual(new Date('2024-01-01'));
    });
  });

  describe('updatePassword', () => {
    it('Should update user password', async () => {
      repositoryMock.findOne.mockResolvedValue({ ...mockUser });
      repositoryMock.save.mockResolvedValue(mockUser);

      await service.updatePassword(mockUser.id, 'NewPassword123');

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'NewPassword123' }),
      );
    });
  });

  describe('createUser', () => {
    it('Should create a new user successfully', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(mockUser);
      repositoryMock.create.mockReturnValue({ ...mockUser, save: mockSave });

      const result = await service.createUser(mockCreateUserDto);

      expect(repositoryMock.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockUser);
    });

    it('Should throw ConflictException when email already exists', async () => {
      repositoryMock.findOne.mockResolvedValue({ ...mockUser, active: true });

      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('Should throw ConflictException with specific message when email was deleted', async () => {
      repositoryMock.findOne.mockResolvedValue({ ...mockUserInactive });

      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateUser', () => {
    it('Should update user successfully and invalidate cache', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      const mockSave = jest.fn().mockResolvedValue(updatedUser);
      cacheManagerMock.get.mockResolvedValue(mockUser);
      repositoryMock.preload.mockResolvedValue({
        ...updatedUser,
        save: mockSave,
      });

      const result = await service.updateUser(mockUser.id, mockUpdateUserDto);

      expect(repositoryMock.preload).toHaveBeenCalledWith({
        id: mockUser.id,
        ...mockUpdateUserDto,
      });
      expect(cacheManagerMock.del).toHaveBeenCalledWith(
        `user:id:${mockUser.id}`,
      );
      expect(cacheManagerMock.del).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
      expect(result.name).toBe(mockUpdateUserDto.name);
    });

    it('Should throw NotFoundException when user not found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('non-existent-id', mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserById', () => {
    it('Should return user by ID from database and cache it', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        `user:id:${mockUser.id}`,
      );
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, active: true },
      });
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `user:id:${mockUser.id}`,
        mockUser,
        60000,
      );
      expect(result).toEqual(mockUser);
    });

    it('Should return user from cache when available', async () => {
      cacheManagerMock.get.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        `user:id:${mockUser.id}`,
      );
      expect(repositoryMock.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('Should throw NotFoundException when user not found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getUserById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('Should return paginated users', async () => {
      const users = [mockUser];
      repositoryMock.findAndCount.mockResolvedValue([users, 10]);

      const result = await service.getAllUsers(10, 0, '', 'createdAt', 'ASC');

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: { active: true },
        order: { createdAt: 'ASC' },
      });
      expect(result.items).toEqual(users);
      expect(result.total).toBe(10);
    });

    it('Should return next skip when more items exist', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockUser], 20]);

      const result = await service.getAllUsers(10, 0, '', 'createdAt', 'ASC');

      expect(result.skip).toBe(10);
    });

    it('Should return null skip when no more items', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockUser], 5]);

      const result = await service.getAllUsers(10, 0, '', 'createdAt', 'ASC');

      expect(result.skip).toBeNull();
    });

    it('Should return empty response when no users found', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAllUsers(10, 0, '', 'createdAt', 'ASC');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.skip).toBeNull();
    });

    it('Should filter by search term', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.getAllUsers(10, 0, 'Test', 'createdAt', 'ASC');

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('Should use valid sort field', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.getAllUsers(10, 0, '', 'name', 'DESC');

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'DESC' },
        }),
      );
    });

    it('Should fallback to createdAt for invalid sort field', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.getAllUsers(10, 0, '', 'invalidField', 'ASC');

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });

  describe('deleteUser', () => {
    it('Should soft delete a user and invalidate cache', async () => {
      cacheManagerMock.get.mockResolvedValue(mockUser);
      repositoryMock.save.mockResolvedValue({ ...mockUser, active: false });

      const result = await service.deleteUser(mockUser.id);

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
          deleteAt: expect.any(String),
        }),
      );
      expect(cacheManagerMock.del).toHaveBeenCalledWith(
        `user:id:${mockUser.id}`,
      );
      expect(cacheManagerMock.del).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
      expect(result).toBe('removed');
    });

    it('Should throw NotFoundException when user not found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
