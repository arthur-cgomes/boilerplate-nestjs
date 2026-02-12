import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  Repository,
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { AuditLog } from './entity/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { AuditContext } from './interfaces/audit-context.interface';
import { AuditAction } from './enum/audit-action.enum';
import { APP_CONSTANTS } from '../common/constants';

const CACHE_PREFIX = 'audit:';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async logCreate(
    entityName: string,
    entityId: string,
    newValue: Record<string, unknown>,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.createLog(
      entityName,
      entityId,
      AuditAction.CREATE,
      null,
      this.sanitizeValue(newValue),
      null,
      context,
    );
  }

  async logUpdate(
    entityName: string,
    entityId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    context?: AuditContext,
  ): Promise<AuditLog> {
    const changedFields = this.getChangedFields(oldValue, newValue);

    if (changedFields.length === 0) {
      this.logger.debug(`No changes detected for ${entityName}:${entityId}`);
      return null;
    }

    return this.createLog(
      entityName,
      entityId,
      AuditAction.UPDATE,
      this.sanitizeValue(oldValue),
      this.sanitizeValue(newValue),
      changedFields,
      context,
    );
  }

  async logDelete(
    entityName: string,
    entityId: string,
    oldValue: Record<string, unknown>,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.createLog(
      entityName,
      entityId,
      AuditAction.DELETE,
      this.sanitizeValue(oldValue),
      null,
      null,
      context,
    );
  }

  private async createLog(
    entityName: string,
    entityId: string,
    action: AuditAction,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    changedFields: string[] | null,
    context?: AuditContext,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        entityName,
        entityId,
        action,
        oldValue,
        newValue,
        changedFields,
        userId: context?.userId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });

      const saved = await this.auditLogRepository.save(auditLog);
      this.logger.debug(
        `Audit log created: ${action} on ${entityName}:${entityId}`,
      );
      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create audit log: ${message}`, stack);
      throw error;
    }
  }

  async getAuditLogs(
    query: AuditLogQueryDto,
  ): Promise<GetAllResponseDto<AuditLog>> {
    const take = query.take || 20;
    const skip = query.skip || 0;

    const where: FindOptionsWhere<AuditLog> = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.entityName) {
      where.entityName = query.entityName;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.startDate && query.endDate) {
      (where as Record<string, unknown>).createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      (where as Record<string, unknown>).createdAt = MoreThanOrEqual(
        new Date(query.startDate),
      );
    } else if (query.endDate) {
      (where as Record<string, unknown>).createdAt = LessThanOrEqual(
        new Date(query.endDate),
      );
    }

    const [items, total] = await this.auditLogRepository.findAndCount({
      where,
      take,
      skip,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    if (items.length === 0) {
      return { skip: null, total: 0, items };
    }

    const over = total - Number(take) - Number(skip);
    const nextSkip = over <= 0 ? null : Number(skip) + Number(take);

    return { skip: nextSkip, total, items };
  }

  async getEntityHistory(
    entityName: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    const cacheKey = `${CACHE_PREFIX}entity:${entityName}:${entityId}`;

    const cached = await this.cacheManager.get<AuditLog[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const logs = await this.auditLogRepository.find({
      where: { entityName, entityId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    // TTL maior pois logs de auditoria são imutáveis
    await this.cacheManager.set(cacheKey, logs, APP_CONSTANTS.CACHE.AUDIT_TTL);

    return logs;
  }

  async getUserActivity(userId: string, take = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      take,
      order: { createdAt: 'DESC' },
    });
  }

  private getChangedFields(
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
  ): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    for (const key of allKeys) {
      if (this.shouldSkipField(key)) {
        continue;
      }

      const oldVal = oldValue?.[key];
      const newVal = newValue?.[key];

      if (!this.isEqual(oldVal, newVal)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  private shouldSkipField(field: string): boolean {
    const skipFields = ['updatedAt', 'createdAt', 'password', 'passwordHash'];
    return skipFields.includes(field);
  }

  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  private sanitizeValue(
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!value) return null;

    const sensitiveFields = [
      'password',
      'passwordHash',
      'secret',
      'apiKey',
      'privateKey',
      'token',
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof val === 'object' &&
        val !== null &&
        !(val instanceof Date)
      ) {
        sanitized[key] = this.sanitizeValue(val as Record<string, unknown>);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }
}
