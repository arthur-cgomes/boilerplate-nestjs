import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/password.validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({
    description: 'Token de recuperação de senha',
    example: 'abc123-token-xyz',
  })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenha@123',
  })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @IsStrongPassword()
  newPassword: string;
}
