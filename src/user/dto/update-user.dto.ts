import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from '../../common/enum/user-type.enum';

export class UpdateUserDto {
  @ApiProperty({
    type: String,
    description: 'Email do usuário',
    example: 'usuario@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

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
    required: false,
  })
  @IsEnum(UserType, { message: 'Tipo de usuário inválido' })
  @IsOptional()
  userType?: UserType;
}
