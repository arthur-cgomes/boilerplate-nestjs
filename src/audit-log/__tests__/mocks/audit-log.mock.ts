import { AuditAction } from '../../enum/audit-action.enum';
import { AuditContext } from '../../interfaces/audit-context.interface';
import { AuditLog } from '../../entity/audit-log.entity';

export const mockAuditContext: AuditContext = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

export const mockAuditLog: Partial<AuditLog> = {
  id: 'audit-log-id-1',
  userId: mockAuditContext.userId,
  entityName: 'User',
  entityId: 'entity-id-1',
  action: AuditAction.CREATE,
  oldValue: null,
  newValue: { name: 'Test User', email: 'test@test.com' },
  changedFields: null,
  ipAddress: mockAuditContext.ipAddress,
  userAgent: mockAuditContext.userAgent,
  createdAt: '2024-01-15T10:30:00.000Z',
};

export const mockAuditLogUpdate: Partial<AuditLog> = {
  id: 'audit-log-id-2',
  userId: mockAuditContext.userId,
  entityName: 'User',
  entityId: 'entity-id-1',
  action: AuditAction.UPDATE,
  oldValue: { name: 'Old Name', email: 'old@test.com' },
  newValue: { name: 'New Name', email: 'new@test.com' },
  changedFields: ['name', 'email'],
  ipAddress: mockAuditContext.ipAddress,
  userAgent: mockAuditContext.userAgent,
  createdAt: '2024-01-15T11:30:00.000Z',
};

export const mockAuditLogDelete: Partial<AuditLog> = {
  id: 'audit-log-id-3',
  userId: mockAuditContext.userId,
  entityName: 'User',
  entityId: 'entity-id-1',
  action: AuditAction.DELETE,
  oldValue: { name: 'Test User', email: 'test@test.com' },
  newValue: null,
  changedFields: null,
  ipAddress: mockAuditContext.ipAddress,
  userAgent: mockAuditContext.userAgent,
  createdAt: '2024-01-15T12:30:00.000Z',
};

export const mockOldValue = {
  name: 'Old Name',
  email: 'old@test.com',
  password: 'secret123',
};

export const mockNewValue = {
  name: 'New Name',
  email: 'new@test.com',
  password: 'newsecret456',
};

export const mockSanitizedOldValue = {
  name: 'Old Name',
  email: 'old@test.com',
  password: '[REDACTED]',
};

export const mockSanitizedNewValue = {
  name: 'New Name',
  email: 'new@test.com',
  password: '[REDACTED]',
};

export const mockAuditLogQueryDto = {
  take: 20,
  skip: 0,
  userId: mockAuditContext.userId,
  entityName: 'User',
  action: AuditAction.CREATE,
};
