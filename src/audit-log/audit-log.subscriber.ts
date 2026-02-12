import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { AuditLog } from './entity/audit-log.entity';
import { auditContext } from './middleware/audit-context';
import { AuditAction } from './enum/audit-action.enum';

const AUDITED_ENTITIES = ['User', 'FileRecord'];

@Injectable()
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditLogSubscriber.name);

  constructor(@InjectDataSource() dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  private shouldAudit(entityName: string): boolean {
    return AUDITED_ENTITIES.includes(entityName);
  }

  private getEntityName(entity: unknown): string {
    return entity?.constructor?.name || 'Unknown';
  }

  private getContext(): {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      userId: auditContext.getUserId(),
      ipAddress: auditContext.getIpAddress(),
      userAgent: auditContext.getUserAgent(),
    };
  }

  private entityToRecord(entity: unknown): Record<string, unknown> {
    if (!entity || typeof entity !== 'object') return {};
    const record: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entity)) {
      if (typeof value !== 'function' && !key.startsWith('_')) {
        record[key] = value;
      }
    }
    return record;
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
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  async afterInsert(event: InsertEvent<unknown>): Promise<void> {
    const entityName = this.getEntityName(event.entity);
    if (!this.shouldAudit(entityName)) return;

    try {
      const context = this.getContext();
      const entityId = (event.entity as { id?: string })?.id;

      if (!entityId) return;

      const auditLog = event.manager.create(AuditLog, {
        entityName,
        entityId,
        action: AuditAction.CREATE,
        oldValue: null,
        newValue: this.sanitizeValue(this.entityToRecord(event.entity)),
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      await event.manager.save(AuditLog, auditLog);
      this.logger.debug(`Audit: CREATE on ${entityName}:${entityId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create audit log: ${message}`);
    }
  }

  async afterUpdate(event: UpdateEvent<unknown>): Promise<void> {
    const entityName = this.getEntityName(event.entity);
    if (!this.shouldAudit(entityName)) return;

    try {
      const context = this.getContext();
      const entityId = (event.entity as { id?: string })?.id;

      if (!entityId) return;

      const oldValue = event.databaseEntity
        ? this.sanitizeValue(this.entityToRecord(event.databaseEntity))
        : null;
      const newValue = this.sanitizeValue(this.entityToRecord(event.entity));

      const changedFields = this.getChangedFields(oldValue, newValue);
      if (changedFields.length === 0) return;

      const auditLog = event.manager.create(AuditLog, {
        entityName,
        entityId,
        action: AuditAction.UPDATE,
        oldValue,
        newValue,
        changedFields,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      await event.manager.save(AuditLog, auditLog);
      this.logger.debug(
        `Audit: UPDATE on ${entityName}:${entityId} - fields: ${changedFields.join(', ')}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create audit log: ${message}`);
    }
  }

  async beforeRemove(event: RemoveEvent<unknown>): Promise<void> {
    const entityName = this.getEntityName(event.entity);
    if (!this.shouldAudit(entityName)) return;

    try {
      const context = this.getContext();
      const entityId = (event.entity as { id?: string })?.id;

      if (!entityId) return;

      const auditLog = event.manager.create(AuditLog, {
        entityName,
        entityId,
        action: AuditAction.DELETE,
        oldValue: this.sanitizeValue(this.entityToRecord(event.entity)),
        newValue: null,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      await event.manager.save(AuditLog, auditLog);
      this.logger.debug(`Audit: DELETE on ${entityName}:${entityId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create audit log: ${message}`);
    }
  }

  private getChangedFields(
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
  ): string[] {
    const changedFields: string[] = [];
    const skipFields = ['updatedAt', 'createdAt'];
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    for (const key of allKeys) {
      if (skipFields.includes(key)) continue;

      const oldVal = oldValue?.[key];
      const newVal = newValue?.[key];

      if (!this.isEqual(oldVal, newVal)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }
}
