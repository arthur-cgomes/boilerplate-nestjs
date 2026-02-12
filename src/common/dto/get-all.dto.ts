import { ApiProperty } from '@nestjs/swagger';

export class GetAllResponseDto<T> {
  @ApiProperty({
    description: 'Total de registros que correspondem aos critérios',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description:
      'Próxima posição no conjunto de resultados, ou null se não houver mais',
    example: 10,
    nullable: true,
  })
  skip: number | null;

  @ApiProperty({
    description: 'Lista de itens',
    isArray: true,
  })
  items: T[];
}
