jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FeatureFlagService } from '../feature-flag.service';
import { FeatureFlag } from '../entity/feature-flag.entity';
import {
  MockRepository,
  repositoryMockFactory,
} from '../../common/utils/test.util';
import {
  mockFeatureFlag,
  mockFeatureFlagDisabled,
  mockFeatureFlagWithRollout,
  mockFeatureFlagWithUserTypes,
  mockFeatureFlagFuture,
  mockFeatureFlagExpired,
  mockFeatureFlagWithEnvironments,
  mockFeatureFlagWithAllowedUsers,
  mockCreateFeatureFlagDto,
  mockUpdateFeatureFlagDto,
  mockFeatureFlagContext,
  mockFeatureFlagContextAdmin,
} from './mocks/feature-flag.mock';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let repositoryMock: MockRepository<FeatureFlag>;
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let configService: { get: jest.Mock };

  beforeAll(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    configService = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'NODE_ENV') return defaultValue || 'local';
          return null;
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: getRepositoryToken(FeatureFlag),
          useValue: repositoryMockFactory<FeatureFlag>(),
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    repositoryMock = module.get(getRepositoryToken(FeatureFlag));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        if (key === 'NODE_ENV') return defaultValue || 'local';
        return null;
      },
    );
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('Should create a new feature flag', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.create.mockReturnValue(mockFeatureFlag);
      repositoryMock.save.mockResolvedValue(mockFeatureFlag);
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.create(mockCreateFeatureFlagDto);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { key: mockCreateFeatureFlagDto.key },
      });
      expect(repositoryMock.create).toHaveBeenCalledWith(
        mockCreateFeatureFlagDto,
      );
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith(
        `feature_flag:${mockCreateFeatureFlagDto.key}`,
      );
      expect(result).toEqual(mockFeatureFlag);
    });

    it('Should throw ConflictException when key already exists', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFeatureFlag);

      await expect(service.create(mockCreateFeatureFlagDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('Should update a feature flag', async () => {
      const updatedFlag = { ...mockFeatureFlag, ...mockUpdateFeatureFlagDto };
      repositoryMock.findOne.mockResolvedValue(mockFeatureFlag);
      repositoryMock.save.mockResolvedValue(updatedFlag);
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.update(
        mockFeatureFlag.id,
        mockUpdateFeatureFlagDto,
      );

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
      expect(result.name).toBe(mockUpdateFeatureFlagDto.name);
    });

    it('Should throw NotFoundException when flag not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', mockUpdateFeatureFlagDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('Should delete a feature flag', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFeatureFlag);
      repositoryMock.remove.mockResolvedValue(mockFeatureFlag);
      cacheManager.del.mockResolvedValue(undefined);

      await service.delete(mockFeatureFlag.id);

      expect(repositoryMock.remove).toHaveBeenCalledWith(mockFeatureFlag);
      expect(cacheManager.del).toHaveBeenCalledWith(
        `feature_flag:${mockFeatureFlag.key}`,
      );
    });

    it('Should throw NotFoundException when flag not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('Should return a feature flag by ID', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFeatureFlag);

      const result = await service.findById(mockFeatureFlag.id);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: mockFeatureFlag.id },
      });
      expect(result).toEqual(mockFeatureFlag);
    });

    it('Should throw NotFoundException when flag not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByKey', () => {
    it('Should return flag from cache when available', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlag);

      const result = await service.findByKey(mockFeatureFlag.key);

      expect(cacheManager.get).toHaveBeenCalledWith(
        `feature_flag:${mockFeatureFlag.key}`,
      );
      expect(repositoryMock.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockFeatureFlag);
    });

    it('Should fetch from DB and cache when not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(mockFeatureFlag);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.findByKey(mockFeatureFlag.key);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { key: mockFeatureFlag.key },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `feature_flag:${mockFeatureFlag.key}`,
        mockFeatureFlag,
        expect.any(Number),
      );
      expect(result).toEqual(mockFeatureFlag);
    });

    it('Should return null when flag not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findByKey('non-existent-key');

      expect(cacheManager.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('Should return paginated feature flags', async () => {
      const flags = [mockFeatureFlag, mockFeatureFlagDisabled];
      repositoryMock.findAndCount.mockResolvedValue([flags, 2]);

      const result = await service.findAll(20, 0);

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        take: 20,
        skip: 0,
        order: { key: 'ASC' },
      });
      expect(result.items).toEqual(flags);
      expect(result.total).toBe(2);
      expect(result.skip).toBeNull();
    });

    it('Should return next skip when more items exist', async () => {
      const flags = [mockFeatureFlag];
      repositoryMock.findAndCount.mockResolvedValue([flags, 10]);

      const result = await service.findAll(1, 0);

      expect(result.skip).toBe(1);
    });

    it('Should return empty response when no flags exist', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.skip).toBeNull();
    });
  });

  describe('isEnabled', () => {
    it('Should return false when flag not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.isEnabled('non-existent-key');

      expect(result).toBe(false);
    });

    it('Should return false when flag is disabled', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagDisabled);

      const result = await service.isEnabled(mockFeatureFlagDisabled.key);

      expect(result).toBe(false);
    });

    it('Should return true when flag is enabled with no conditions', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlag);

      const result = await service.isEnabled(mockFeatureFlag.key);

      expect(result).toBe(true);
    });

    it('Should return false when start date is in the future', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagFuture);

      const result = await service.isEnabled(mockFeatureFlagFuture.key);

      expect(result).toBe(false);
    });

    it('Should return false when end date has passed', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagExpired);

      const result = await service.isEnabled(mockFeatureFlagExpired.key);

      expect(result).toBe(false);
    });

    it('Should return false when environment is not allowed', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagWithEnvironments);

      const result = await service.isEnabled(
        mockFeatureFlagWithEnvironments.key,
      );

      expect(result).toBe(false);
    });

    it('Should return true when user is in allowed list', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagWithAllowedUsers);

      const result = await service.isEnabled(
        mockFeatureFlagWithAllowedUsers.key,
        mockFeatureFlagContext,
      );

      expect(result).toBe(true);
    });

    it('Should return false when user type is not allowed', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagWithUserTypes);

      const result = await service.isEnabled(
        mockFeatureFlagWithUserTypes.key,
        mockFeatureFlagContext,
      );

      expect(result).toBe(false);
    });

    it('Should return true when user type is allowed', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagWithUserTypes);

      const result = await service.isEnabled(
        mockFeatureFlagWithUserTypes.key,
        mockFeatureFlagContextAdmin,
      );

      expect(result).toBe(true);
    });

    it('Should handle rollout percentage', async () => {
      cacheManager.get.mockResolvedValue(mockFeatureFlagWithRollout);

      const result = await service.isEnabled(
        mockFeatureFlagWithRollout.key,
        mockFeatureFlagContext,
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getAllFlagsForUser', () => {
    it('Should return all flags evaluated for user context', async () => {
      const flags = [mockFeatureFlag, mockFeatureFlagDisabled];
      repositoryMock.find.mockResolvedValue(flags);

      const result = await service.getAllFlagsForUser(mockFeatureFlagContext);

      expect(repositoryMock.find).toHaveBeenCalled();
      expect(result[mockFeatureFlag.key]).toBe(true);
      expect(result[mockFeatureFlagDisabled.key]).toBe(false);
    });

    it('Should return empty object when no flags exist', async () => {
      repositoryMock.find.mockResolvedValue([]);

      const result = await service.getAllFlagsForUser();

      expect(result).toEqual({});
    });
  });

  describe('toggle', () => {
    it('Should toggle flag from enabled to disabled', async () => {
      const toggledFlag = { ...mockFeatureFlag, active: false };
      repositoryMock.findOne.mockResolvedValue({ ...mockFeatureFlag });
      repositoryMock.save.mockResolvedValue(toggledFlag);
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.toggle(mockFeatureFlag.id);

      expect(result.active).toBe(false);
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('Should toggle flag from disabled to enabled', async () => {
      const toggledFlag = { ...mockFeatureFlagDisabled, active: true };
      repositoryMock.findOne.mockResolvedValue({ ...mockFeatureFlagDisabled });
      repositoryMock.save.mockResolvedValue(toggledFlag);
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.toggle(mockFeatureFlagDisabled.id);

      expect(result.active).toBe(true);
    });

    it('Should throw NotFoundException when flag not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.toggle('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
