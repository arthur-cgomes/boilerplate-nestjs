import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de retorno',
    example: 'Operação realizada com sucesso',
  })
  message: string;
}

export class PasswordResetRequestResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Token de recuperação enviado para o email',
  })
  message: string;

  @ApiProperty({
    description: 'Token de recuperação (apenas em desenvolvimento)',
    example: 'a1b2c3d4e5f6g7h8i9j0',
    required: false,
  })
  token?: string;
}
