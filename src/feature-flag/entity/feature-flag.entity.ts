import { BaseCollection } from '../../common/entity/base.entity';
import { Entity, Column, Index } from 'typeorm';
import { FeatureFlagConditions } from '../interfaces/feature-flag-conditions.interface';
import { ApiProperty } from '@nestjs/swagger';

@Entity('feature_flag')
export class FeatureFlag extends BaseCollection {
  @ApiProperty({
    description: 'Chave única para identificar a feature flag',
    example: 'sale-dashboard',
    uniqueItems: true,
  })
  @Column({ length: 100, unique: true })
  @Index()
  key: string;

  @ApiProperty({
    description: 'Nome da feature flag',
    example: 'Dashboard de Vendas',
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada do propósito desta flag',
    required: false,
    example: 'Ativa o novo dashboard de vendas',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Condições específicas para ativação (JSON)',
    required: false,
    type: Object,
    example: { browser: 'chrome', country: 'BR' },
  })
  @Column({ type: 'jsonb', nullable: true })
  conditions: FeatureFlagConditions;

  @ApiProperty({
    description: 'Porcentagem de usuários que receberão a feature (0-100)',
    default: 100,
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

  @ApiProperty({
    description: 'Lista de IDs de usuários permitidos especificamente',
    required: false,
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @Column({ type: 'simple-array', nullable: true })
  allowedUserIds: string[];

  @ApiProperty({
    description: 'Lista de tipos de usuários permitidos (ex: admin, user)',
    required: false,
    type: [String],
    example: ['admin', 'manager'],
  })
  @Column({ type: 'simple-array', nullable: true })
  allowedUserTypes: string[];

  @ApiProperty({
    description: 'Ambientes onde a flag está ativa',
    required: false,
    type: [String],
    example: ['development', 'staging', 'production'],
  })
  @Column({ type: 'simple-array', nullable: true })
  allowedEnvironments: string[];

  @ApiProperty({
    description: 'Data de início da vigência da flag',
    required: false,
    type: Date,
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiProperty({
    description: 'Data de término da vigência da flag',
    required: false,
    type: Date,
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;
}
