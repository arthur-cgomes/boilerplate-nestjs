import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckItemDto {
  @ApiProperty({
    description: 'Nome do serviço verificado',
    example: 'Database',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do serviço',
    example: 'internal',
  })
  type: string;

  @ApiProperty({
    description: 'Status da verificação',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    description: 'Detalhes adicionais',
    example: 'Connected',
    required: false,
  })
  details?: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Tempo de atividade em segundos',
    example: 12345.678,
  })
  uptime: number;

  @ApiProperty({
    description: 'Status geral da aplicação',
    example: 'OK',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp em milissegundos',
    example: 1705312200000,
  })
  timestamp: number;

  @ApiProperty({
    description: 'Lista de verificações realizadas',
    type: [HealthCheckItemDto],
    example: [
      {
        name: 'Database',
        type: 'internal',
        status: true,
        details: 'Connected',
      },
      { name: 'Redis', type: 'internal', status: true, details: 'Connected' },
    ],
  })
  checks: HealthCheckItemDto[];
}
