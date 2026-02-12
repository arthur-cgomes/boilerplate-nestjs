import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  IsObject,
  Matches,
} from 'class-validator';
import { FeatureFlagConditions } from '../interfaces/feature-flag-conditions.interface';

export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'Chave única da feature flag (snake_case)',
    example: 'new_dashboard',
  })
  @IsNotEmpty({ message: 'Chave é obrigatória' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'Chave deve ser em snake_case (letras minúsculas, números e underscores)',
  })
  key: string;

  @ApiProperty({
    description: 'Nome legível da feature flag',
    example: 'Novo Dashboard',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da feature flag',
    example: 'Habilita o novo layout do dashboard para usuários selecionados',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Se a feature está habilitada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Condições adicionais para ativação',
    example: { userTypes: ['admin'], environments: ['production'] },
  })
  @IsOptional()
  @IsObject()
  conditions?: FeatureFlagConditions;

  @ApiPropertyOptional({
    description: 'Percentual de rollout (0-100)',
    example: 50,
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({
    description: 'IDs de usuários que sempre terão acesso',
    example: ['uuid1', 'uuid2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Tipos de usuário que terão acesso',
    example: ['admin', 'global'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUserTypes?: string[];

  @ApiPropertyOptional({
    description: 'Ambientes onde a flag estará ativa',
    example: ['development', 'production'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedEnvironments?: string[];

  @ApiPropertyOptional({
    description: 'Data de início de ativação',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim de ativação',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
