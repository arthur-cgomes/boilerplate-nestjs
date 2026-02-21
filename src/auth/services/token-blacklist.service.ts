import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { APP_CONSTANTS } from '../../common/constants/app.constants';

@Injectable()
export class TokenBlacklistService {
  private readonly prefix = 'blacklist:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async blacklistToken(token: string): Promise<void> {
    const ttl =
      this.configService.get<number>('EXPIRE_IN') ||
      APP_CONSTANTS.JWT.DEFAULT_EXPIRATION;

    await this.cacheManager.set(`${this.prefix}${token}`, true, ttl * 1000);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`${this.prefix}${token}`);
    return result === true;
  }

  async blacklistUserTokens(userId: string, tokens: string[]): Promise<void> {
    const ttl =
      this.configService.get<number>('EXPIRE_IN') ||
      APP_CONSTANTS.JWT.DEFAULT_EXPIRATION;

    await Promise.all(
      tokens.map((token) =>
        this.cacheManager.set(`${this.prefix}${token}`, true, ttl * 1000),
      ),
    );
  }
}
