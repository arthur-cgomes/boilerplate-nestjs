jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuditLogService } from '../audit-log.service';
import { AuditLog } from '../entity/audit-log.entity';
import { AuditAction } from '../enum/audit-action.enum';
import {
  MockRepository,
  MockCacheManager,
  repositoryMockFactory,
  cacheManagerMockFactory,
} from '../../common/utils/test.util';
import {
  mockAuditContext,
  mockAuditLog,
  mockAuditLogUpdate,
  mockOldValue,
  mockNewValue,
} from './mocks/audit-log.mock';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repositoryMock: MockRepository<AuditLog>;

  let cacheManagerMock: MockCacheManager;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: repositoryMockFactory<AuditLog>(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMockFactory(),
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repositoryMock = module.get(getRepositoryToken(AuditLog));
    cacheManagerMock = module.get(CACHE_MANAGER);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logCreate', () => {
    it('Should create an audit log for entity creation', async () => {
      const newValue = { name: 'Test User', email: 'test@test.com' };
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockResolvedValue(mockAuditLog);

      const result = await service.logCreate(
        'User',
        'entity-id-1',
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        entityName: 'User',
        entityId: 'entity-id-1',
        action: AuditAction.CREATE,
        oldValue: null,
        newValue,
        changedFields: null,
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      });
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLog);
    });

    it('Should sanitize sensitive fields in newValue', async () => {
      const newValue = {
        name: 'Test User',
        password: 'secret123',
        apiKey: 'api-key-123',
      };
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockResolvedValue(mockAuditLog);

      await service.logCreate(
        'User',
        'entity-id-1',
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: {
            name: 'Test User',
            password: '[REDACTED]',
            apiKey: '[REDACTED]',
          },
        }),
      );
    });

    it('Should create log without context', async () => {
      const newValue = { name: 'Test User' };
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockResolvedValue(mockAuditLog);

      await service.logCreate('User', 'entity-id-1', newValue);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
          ipAddress: undefined,
          userAgent: undefined,
        }),
      );
    });

    it('Should handle null newValue in logCreate', async () => {
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockResolvedValue(mockAuditLog);

      await service.logCreate('User', 'entity-id-1', null, mockAuditContext);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: null,
        }),
      );
    });

    it('Should throw error when repository save fails', async () => {
      const newValue = { name: 'Test User' };
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.logCreate('User', 'entity-id-1', newValue, mockAuditContext),
      ).rejects.toThrow('Database error');
    });

    it('Should handle non-Error objects in catch block', async () => {
      const newValue = { name: 'Test User' };
      repositoryMock.create.mockReturnValue(mockAuditLog);
      repositoryMock.save.mockRejectedValue('string error');

      await expect(
        service.logCreate('User', 'entity-id-1', newValue, mockAuditContext),
      ).rejects.toEqual('string error');
    });
  });

  describe('logUpdate', () => {
    it('Should create an audit log for entity update with changed fields', async () => {
      const oldValue = { name: 'Old Name', email: 'old@test.com' };
      const newValue = { name: 'New Name', email: 'old@test.com' };
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          changedFields: ['name'],
        }),
      );
      expect(result).toEqual(mockAuditLogUpdate);
    });

    it('Should return null when no changes detected', async () => {
      const oldValue = { name: 'Same Name', email: 'same@test.com' };
      const newValue = { name: 'Same Name', email: 'same@test.com' };

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(result).toBeNull();
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });

    it('Should skip updatedAt and createdAt from change detection', async () => {
      const oldValue = {
        name: 'Same Name',
        updatedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      };
      const newValue = {
        name: 'Same Name',
        updatedAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
      };

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(result).toBeNull();
    });

    it('Should skip password fields from change detection', async () => {
      const oldValue = {
        name: 'Same Name',
        password: 'old',
        passwordHash: 'old',
      };
      const newValue = {
        name: 'Same Name',
        password: 'new',
        passwordHash: 'new',
      };

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(result).toBeNull();
    });

    it('Should sanitize sensitive fields in both old and new values', async () => {
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      await service.logUpdate(
        'User',
        'entity-id-1',
        mockOldValue,
        mockNewValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: expect.objectContaining({ password: '[REDACTED]' }),
          newValue: expect.objectContaining({ password: '[REDACTED]' }),
        }),
      );
    });

    it('Should detect changes in nested objects', async () => {
      const oldValue = { settings: { theme: 'dark' } };
      const newValue = { settings: { theme: 'light' } };
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['settings'],
        }),
      );
    });

    it('Should handle Date comparison correctly', async () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const oldValue = { birthDate: date };
      const newValue = { birthDate: new Date(date.getTime()) };

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(result).toBeNull();
    });

    it('Should handle null oldValue', async () => {
      const newValue = { name: 'New Name' };
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      await service.logUpdate(
        'User',
        'entity-id-1',
        null,
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['name'],
        }),
      );
    });

    it('Should handle null newValue', async () => {
      const oldValue = { name: 'Old Name' };
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        null,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['name'],
        }),
      );
    });

    it('Should handle both null and undefined values as equal', async () => {
      const oldValue = { name: null };
      const newValue = { name: undefined };

      const result = await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(result).toBeNull();
    });

    it('Should detect change when one value is null and other is defined', async () => {
      const oldValue = { name: null };
      const newValue = { name: 'New Name' };
      repositoryMock.create.mockReturnValue(mockAuditLogUpdate);
      repositoryMock.save.mockResolvedValue(mockAuditLogUpdate);

      await service.logUpdate(
        'User',
        'entity-id-1',
        oldValue,
        newValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: ['name'],
        }),
      );
    });
  });

  describe('logDelete', () => {
    it('Should create an audit log for entity deletion', async () => {
      const oldValue = { name: 'Test User', email: 'test@test.com' };
      const mockDeleteLog = { ...mockAuditLog, action: AuditAction.DELETE };
      repositoryMock.create.mockReturnValue(mockDeleteLog);
      repositoryMock.save.mockResolvedValue(mockDeleteLog);

      const result = await service.logDelete(
        'User',
        'entity-id-1',
        oldValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        entityName: 'User',
        entityId: 'entity-id-1',
        action: AuditAction.DELETE,
        oldValue,
        newValue: null,
        changedFields: null,
        userId: mockAuditContext.userId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent,
      });
      expect(result).toEqual(mockDeleteLog);
    });

    it('Should sanitize sensitive fields in oldValue', async () => {
      const oldValue = { name: 'Test User', token: 'secret-token' };
      const mockDeleteLog = { ...mockAuditLog, action: AuditAction.DELETE };
      repositoryMock.create.mockReturnValue(mockDeleteLog);
      repositoryMock.save.mockResolvedValue(mockDeleteLog);

      await service.logDelete(
        'User',
        'entity-id-1',
        oldValue,
        mockAuditContext,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: {
            name: 'Test User',
            token: '[REDACTED]',
          },
        }),
      );
    });

    it('Should handle null oldValue in logDelete', async () => {
      const mockDeleteLog = { ...mockAuditLog, action: AuditAction.DELETE };
      repositoryMock.create.mockReturnValue(mockDeleteLog);
      repositoryMock.save.mockResolvedValue(mockDeleteLog);

      await service.logDelete('User', 'entity-id-1', null, mockAuditContext);

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: null,
        }),
      );
    });
  });

  describe('getAuditLogs', () => {
    it('Should return paginated audit logs', async () => {
      const mockLogs = [mockAuditLog, mockAuditLogUpdate];
      repositoryMock.findAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.getAuditLogs({ take: 20, skip: 0 });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        where: {},
        take: 20,
        skip: 0,
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
      expect(result).toEqual({
        skip: null,
        total: 2,
        items: mockLogs,
      });
    });

    it('Should use default take and skip values when not provided', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs({});

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        where: {},
        take: 20,
        skip: 0,
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
    });

    it('Should filter by userId', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockAuditLog], 1]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        userId: mockAuditContext.userId,
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockAuditContext.userId },
        }),
      );
    });

    it('Should filter by entityName', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockAuditLog], 1]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        entityName: 'User',
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityName: 'User' },
        }),
      );
    });

    it('Should filter by action', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockAuditLog], 1]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        action: AuditAction.CREATE,
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: AuditAction.CREATE },
        }),
      );
    });

    it('Should filter by entityId', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[mockAuditLog], 1]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        entityId: 'entity-id-1',
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityId: 'entity-id-1' },
        }),
      );
    });

    it('Should filter by date range (both dates)', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        }),
      );
    });

    it('Should filter by startDate only', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        startDate: '2024-01-01',
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalled();
    });

    it('Should filter by endDate only', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs({
        take: 20,
        skip: 0,
        endDate: '2024-01-31',
      });

      expect(repositoryMock.findAndCount).toHaveBeenCalled();
    });

    it('Should return empty response when no items found', async () => {
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAuditLogs({ take: 20, skip: 0 });

      expect(result).toEqual({
        skip: null,
        total: 0,
        items: [],
      });
    });

    it('Should calculate next skip correctly', async () => {
      const mockLogs = Array(20).fill(mockAuditLog);
      repositoryMock.findAndCount.mockResolvedValue([mockLogs, 50]);

      const result = await service.getAuditLogs({ take: 20, skip: 0 });

      expect(result.skip).toBe(20);
    });

    it('Should return null skip when no more items', async () => {
      const mockLogs = Array(10).fill(mockAuditLog);
      repositoryMock.findAndCount.mockResolvedValue([mockLogs, 10]);

      const result = await service.getAuditLogs({ take: 20, skip: 0 });

      expect(result.skip).toBeNull();
    });
  });

  describe('getEntityHistory', () => {
    it('Should return entity history from database and cache it', async () => {
      const mockHistory = [mockAuditLogUpdate, mockAuditLog];
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.find.mockResolvedValue(mockHistory);

      const result = await service.getEntityHistory('User', 'entity-id-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        'audit:entity:User:entity-id-1',
      );
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { entityName: 'User', entityId: 'entity-id-1' },
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        'audit:entity:User:entity-id-1',
        mockHistory,
        300000,
      );
      expect(result).toEqual(mockHistory);
    });

    it('Should return entity history from cache when available', async () => {
      const mockHistory = [mockAuditLogUpdate, mockAuditLog];
      cacheManagerMock.get.mockResolvedValue(mockHistory);

      const result = await service.getEntityHistory('User', 'entity-id-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        'audit:entity:User:entity-id-1',
      );
      expect(repositoryMock.find).not.toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });

    it('Should return empty array when no history found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.find.mockResolvedValue([]);

      const result = await service.getEntityHistory('User', 'non-existent-id');

      expect(result).toEqual([]);
    });
  });

  describe('getUserActivity', () => {
    it('Should return user activity with default limit', async () => {
      const mockActivity = [mockAuditLog, mockAuditLogUpdate];
      repositoryMock.find.mockResolvedValue(mockActivity);

      const result = await service.getUserActivity(mockAuditContext.userId);

      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { userId: mockAuditContext.userId },
        take: 50,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockActivity);
    });

    it('Should return user activity with custom limit', async () => {
      const mockActivity = [mockAuditLog];
      repositoryMock.find.mockResolvedValue(mockActivity);

      const result = await service.getUserActivity(mockAuditContext.userId, 10);

      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { userId: mockAuditContext.userId },
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockActivity);
    });

    it('Should return empty array when no activity found', async () => {
      repositoryMock.find.mockResolvedValue([]);

      const result = await service.getUserActivity('non-existent-user');

      expect(result).toEqual([]);
    });
  });
});
