import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HealthCheckResponse } from './interfaces/health-check-response.interface';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async execute(): Promise<HealthCheckResponse> {
    const checks = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const allHealthy = checks.every((check) => check.status);

    return {
      uptime: process.uptime(),
      message: allHealthy ? 'OK' : 'ERROR',
      timestamp: Date.now(),
      checks,
    };
  }

  private async checkDatabase(): Promise<{
    name: string;
    type: string;
    status: boolean;
    details: string;
  }> {
    try {
      await this.entityManager.query('SELECT 1');
      return {
        name: 'Database',
        type: 'internal',
        status: true,
        details: 'Connected',
      };
    } catch (error) {
      return {
        name: 'Database',
        type: 'internal',
        status: false,
        details: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }

  private async checkRedis(): Promise<{
    name: string;
    type: string;
    status: boolean;
    details: string;
  }> {
    try {
      const testKey = 'health-check-test';
      await this.cacheManager.set(testKey, 'ok', 1000);
      const result = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      if (result === 'ok') {
        return {
          name: 'Redis',
          type: 'internal',
          status: true,
          details: 'Connected',
        };
      }

      return {
        name: 'Redis',
        type: 'internal',
        status: false,
        details: 'Failed to verify cache',
      };
    } catch (error) {
      return {
        name: 'Redis',
        type: 'internal',
        status: false,
        details: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }
}
