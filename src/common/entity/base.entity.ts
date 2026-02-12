import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseCollection extends BaseEntity {
  @ApiProperty({
    type: String,
    description: 'ID único do registro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: Date,
    description: 'Data de criação do registro',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: string;

  @ApiProperty({
    type: Date,
    description: 'Data da última atualização do registro',
    example: '2024-01-15T14:45:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: string;

  @ApiProperty({
    type: String,
    description: 'Data de exclusão lógica do registro',
    example: '2024-01-20T08:00:00.000Z',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true, default: null })
  deleteAt: string | null;

  @ApiProperty({
    type: Boolean,
    description: 'Indica se o registro está ativo',
    example: true,
  })
  @Index()
  @Column({ type: 'bool', default: true })
  active: boolean;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário que criou o registro',
    example: 'João Silva',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;

  @ApiProperty({
    type: String,
    description: 'ID do usuário que criou o registro',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  createdById: string | null;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário que atualizou o registro',
    example: 'Maria Santos',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  updatedBy: string | null;

  @ApiProperty({
    type: String,
    description: 'ID do usuário que atualizou o registro',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  updatedById: string | null;
}
