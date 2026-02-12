jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../services/token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let cacheManager: { get: jest.Mock; set: jest.Mock };
  let configService: { get: jest.Mock };

  beforeAll(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue(7200),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blacklistToken', () => {
    it('Should add token to cache with TTL', async () => {
      const token = 'test-token';

      await service.blacklistToken(token);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:test-token',
        true,
        7200 * 1000,
      );
    });

    it('Should use default TTL when config not set', async () => {
      configService.get.mockReturnValue(null);

      await service.blacklistToken('test-token');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:test-token',
        true,
        7200 * 1000,
      );
    });
  });

  describe('isBlacklisted', () => {
    it('Should return true when token is in cache', async () => {
      cacheManager.get.mockResolvedValue(true);

      const result = await service.isBlacklisted('test-token');

      expect(cacheManager.get).toHaveBeenCalledWith('blacklist:test-token');
      expect(result).toBe(true);
    });

    it('Should return false when token is not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.isBlacklisted('test-token');

      expect(result).toBe(false);
    });

    it('Should return false when cache returns undefined', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.isBlacklisted('test-token');

      expect(result).toBe(false);
    });
  });

  describe('blacklistUserTokens', () => {
    it('Should blacklist multiple tokens', async () => {
      const tokens = ['token1', 'token2', 'token3'];
      configService.get.mockReturnValue(7200);

      await service.blacklistUserTokens('user-id', tokens);

      expect(cacheManager.set).toHaveBeenCalledTimes(3);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:token1',
        true,
        7200 * 1000,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:token2',
        true,
        7200 * 1000,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:token3',
        true,
        7200 * 1000,
      );
    });

    it('Should handle empty tokens array', async () => {
      await service.blacklistUserTokens('user-id', []);

      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('Should use default TTL when config not set', async () => {
      configService.get.mockReturnValue(null);

      await service.blacklistUserTokens('user-id', ['token1']);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'blacklist:token1',
        true,
        7200 * 1000,
      );
    });
  });
});
