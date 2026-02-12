jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { HealthCheckService } from '../health-check.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let entityManager: { query: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeAll(async () => {
    entityManager = {
      query: jest.fn(),
    };

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: getEntityManagerToken(),
          useValue: entityManager,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('Should return OK when all checks pass', async () => {
      entityManager.query.mockResolvedValue([{ '?column?': 1 }]);
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('ok');
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.execute();

      expect(result.message).toBe('OK');
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].name).toBe('Database');
      expect(result.checks[0].status).toBe(true);
      expect(result.checks[1].name).toBe('Redis');
      expect(result.checks[1].status).toBe(true);
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
    });

    it('Should return ERROR when database check fails', async () => {
      entityManager.query.mockRejectedValue(new Error('Connection refused'));
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('ok');
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.execute();

      expect(result.message).toBe('ERROR');
      expect(result.checks[0].status).toBe(false);
      expect(result.checks[0].details).toBe('Connection refused');
      expect(result.checks[1].status).toBe(true);
    });

    it('Should return ERROR when Redis check fails', async () => {
      entityManager.query.mockResolvedValue([{ '?column?': 1 }]);
      cacheManager.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.execute();

      expect(result.message).toBe('ERROR');
      expect(result.checks[0].status).toBe(true);
      expect(result.checks[1].status).toBe(false);
      expect(result.checks[1].details).toBe('Redis connection failed');
    });

    it('Should return ERROR when both checks fail', async () => {
      entityManager.query.mockRejectedValue(new Error('DB error'));
      cacheManager.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.execute();

      expect(result.message).toBe('ERROR');
      expect(result.checks[0].status).toBe(false);
      expect(result.checks[1].status).toBe(false);
    });

    it('Should return ERROR when Redis verification fails', async () => {
      entityManager.query.mockResolvedValue([{ '?column?': 1 }]);
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue(null);
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.execute();

      expect(result.message).toBe('ERROR');
      expect(result.checks[1].status).toBe(false);
      expect(result.checks[1].details).toBe('Failed to verify cache');
    });

    it('Should handle non-Error exceptions in database check', async () => {
      entityManager.query.mockRejectedValue('String error');
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue('ok');
      cacheManager.del.mockResolvedValue(undefined);

      const result = await service.execute();

      expect(result.checks[0].status).toBe(false);
      expect(result.checks[0].details).toBe('Failed to connect');
    });

    it('Should handle non-Error exceptions in Redis check', async () => {
      entityManager.query.mockResolvedValue([{ '?column?': 1 }]);
      cacheManager.set.mockRejectedValue('Non-error thrown');

      const result = await service.execute();

      expect(result.checks[1].status).toBe(false);
      expect(result.checks[1].details).toBe('Failed to connect');
    });
  });
});
