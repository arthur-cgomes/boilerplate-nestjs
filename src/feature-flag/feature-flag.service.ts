import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FeatureFlag } from './entity/feature-flag.entity';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { FeatureFlagContext } from './interfaces/feature-flag-context.interface';
import { APP_CONSTANTS } from '../common/constants/app.constants';

const CACHE_PREFIX = 'feature_flag:';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly currentEnvironment: string;

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.currentEnvironment = this.configService.get<string>(
      'NODE_ENV',
      'local',
    );
  }

  async create(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const existing = await this.featureFlagRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(
        `Feature flag com chave '${dto.key}' ja existe`,
      );
    }

    const featureFlag = this.featureFlagRepository.create(dto);
    const saved = await this.featureFlagRepository.save(featureFlag);

    await this.invalidateCache(dto.key);

    return saved;
  }

  async update(id: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    const featureFlag = await this.findById(id);

    Object.assign(featureFlag, dto);
    const saved = await this.featureFlagRepository.save(featureFlag);

    await this.invalidateCache(featureFlag.key);

    return saved;
  }

  async delete(id: string): Promise<void> {
    const featureFlag = await this.findById(id);
    await this.featureFlagRepository.remove(featureFlag);
    await this.invalidateCache(featureFlag.key);
  }

  async findById(id: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id },
    });

    if (!featureFlag) {
      throw new NotFoundException('Feature flag nao encontrada');
    }

    return featureFlag;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const cacheKey = `${CACHE_PREFIX}${key}`;

    const cached = await this.cacheManager.get<FeatureFlag>(cacheKey);
    if (cached) {
      return cached;
    }

    const featureFlag = await this.featureFlagRepository.findOne({
      where: { key },
    });

    if (featureFlag) {
      await this.cacheManager.set(
        cacheKey,
        featureFlag,
        APP_CONSTANTS.CACHE.FEATURE_FLAG_TTL,
      );
    }

    return featureFlag;
  }

  async findAll(take = 20, skip = 0): Promise<GetAllResponseDto<FeatureFlag>> {
    const [items, total] = await this.featureFlagRepository.findAndCount({
      take,
      skip,
      order: { key: 'ASC' },
    });

    if (items.length === 0) {
      return { skip: null, total: 0, items };
    }

    const over = total - Number(take) - Number(skip);
    const nextSkip = over <= 0 ? null : Number(skip) + Number(take);

    return { skip: nextSkip, total, items };
  }

  async isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean> {
    const featureFlag = await this.findByKey(key);

    if (!featureFlag) {
      this.logger.debug(`Feature flag '${key}' not found, returning false`);
      return false;
    }

    return Promise.resolve(this.evaluateFlag(featureFlag, context));
  }

  async getAllFlagsForUser(
    context?: FeatureFlagContext,
  ): Promise<Record<string, boolean>> {
    const flags = await this.featureFlagRepository.find();
    const result: Record<string, boolean> = {};

    for (const flag of flags) {
      result[flag.key] = this.evaluateFlag(flag, context);
    }

    return result;
  }

  private evaluateFlag(
    flag: FeatureFlag,
    context?: FeatureFlagContext,
  ): boolean {
    if (!flag.active) {
      return false;
    }

    const now = new Date();
    if (flag.startDate && now < new Date(flag.startDate)) {
      return false;
    }

    if (flag.endDate && now > new Date(flag.endDate)) {
      return false;
    }

    if (
      flag.allowedEnvironments &&
      flag.allowedEnvironments.length > 0 &&
      !flag.allowedEnvironments.includes(this.currentEnvironment)
    ) {
      return false;
    }

    if (context?.userId && flag.allowedUserIds?.includes(context.userId)) {
      return true;
    }

    if (
      context?.userType &&
      flag.allowedUserTypes &&
      flag.allowedUserTypes.length > 0
    ) {
      if (!flag.allowedUserTypes.includes(context.userType)) {
        return false;
      }
    }

    if (flag.rolloutPercentage < 100 && context?.userId) {
      const hash = this.hashUserId(context.userId, flag.key);
      if (hash > flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  private hashUserId(userId: string, flagKey: string): number {
    const combined = `${userId}:${flagKey}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash % 100);
  }

  async toggle(id: string): Promise<FeatureFlag> {
    const featureFlag = await this.findById(id);
    featureFlag.active = !featureFlag.active;

    const saved = await this.featureFlagRepository.save(featureFlag);
    await this.invalidateCache(featureFlag.key);

    return saved;
  }

  private async invalidateCache(key: string): Promise<void> {
    await this.cacheManager.del(`${CACHE_PREFIX}${key}`);
  }
}
