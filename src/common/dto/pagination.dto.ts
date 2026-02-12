import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { APP_CONSTANTS } from '../constants';
import { SortOrder } from '../enum/sort-order.enum';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Quantidade de registros por página',
    default: APP_CONSTANTS.PAGINATION.DEFAULT_TAKE,
    minimum: APP_CONSTANTS.PAGINATION.MIN_TAKE,
    maximum: APP_CONSTANTS.PAGINATION.MAX_TAKE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(APP_CONSTANTS.PAGINATION.MIN_TAKE)
  @Max(APP_CONSTANTS.PAGINATION.MAX_TAKE)
  take?: number = APP_CONSTANTS.PAGINATION.DEFAULT_TAKE;

  @ApiPropertyOptional({
    description: 'Quantidade de registros a pular',
    default: APP_CONSTANTS.PAGINATION.DEFAULT_SKIP,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = APP_CONSTANTS.PAGINATION.DEFAULT_SKIP;

  @ApiPropertyOptional({
    description: 'Termo de busca',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
