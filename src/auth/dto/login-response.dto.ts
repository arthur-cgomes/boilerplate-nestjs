import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../common/enum/user-type.enum';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c3VhcmlvQGVtYWlsLmNvbSIsIm5hbWUiOiJKb2FvIFNpbHZhIiwidXNlclR5cGUiOiJ1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de atualização para renovar o access token',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tempo de expiração do token em segundos',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'ID único do usuário',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do usuário',
    enum: UserType,
    example: UserType.USER,
  })
  userType: UserType;
}
