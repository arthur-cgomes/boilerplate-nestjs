import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { AuditAction } from '../enum/audit-action.enum';
import { BaseCollection } from '../../common/entity/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('audit_log')
@Index(['entityName', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['action'])
@Index(['userId', 'createdAt'])
export class AuditLog extends BaseCollection {
  @ApiProperty({
    type: String,
    description: 'ID do usuário que realizou a ação',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ApiProperty({
    type: () => User,
    description: 'Usuário que realizou a ação',
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    type: String,
    description: 'Nome da entidade afetada pela ação',
    example: 'User',
  })
  @Column({ length: 100 })
  entityName: string;

  @ApiProperty({
    type: String,
    description: 'ID da entidade afetada pela ação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid' })
  entityId: string;

  @ApiProperty({
    enum: AuditAction,
    description: 'Ação realizada na entidade',
    example: AuditAction.CREATE,
  })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({
    description: 'Valor antigo da entidade antes da ação',
    example: { name: 'Old Name', email: 'old@email' },
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown>;

  @ApiProperty({
    description: 'Valor novo da entidade depois da ação',
    example: { name: 'New Name', email: 'new@email' },
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, unknown>;

  @ApiProperty({
    type: [String],
    description: 'Lista de campos que foram alterados',
    example: ['name', 'email'],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  changedFields: string[];

  @ApiProperty({
    type: String,
    description: 'Endereço IP do usuário que realizou a ação',
    example: '127.0.0.1',
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  ipAddress: string;

  @ApiProperty({
    type: String,
    description: 'User agent do usuário que realizou a ação',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    nullable: true,
  })
  @Column({ length: 500, nullable: true })
  userAgent: string;
}
