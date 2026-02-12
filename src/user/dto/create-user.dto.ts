import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserType } from '../../common/enum/user-type.enum';
import { IsStrongPassword } from '../../common/validators';

export class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'Email do usuário',
    example: 'usuario@email.com',
  })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    type: String,
    description:
      'Senha do usuário (mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais)',
    example: 'SenhaSegura@123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário que cadastrou o usuário',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    type: String,
    description: 'Id do usuário criador',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiProperty({
    enum: UserType,
    description: 'Define o tipo de usuário',
    default: UserType.USER,
    required: false,
  })
  @IsEnum(UserType, { message: 'Tipo de usuário inválido' })
  @IsOptional()
  userType?: UserType;
}
