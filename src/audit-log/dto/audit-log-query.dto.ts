import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { AuditAction } from '../enum/audit-action.enum';

export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'ID do usuário que realizou a ação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Nome da entidade (tabela)',
    example: 'User',
  })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional({
    description: 'ID da entidade afetada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de ação',
    enum: AuditAction,
    example: AuditAction.UPDATE,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Data inicial do filtro',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final do filtro',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Número de registros a retornar',
    example: 10,
  })
  @IsOptional()
  take?: number;

  @ApiPropertyOptional({
    description: 'Número de registros a pular',
    example: 0,
  })
  @IsOptional()
  skip?: number;
}
