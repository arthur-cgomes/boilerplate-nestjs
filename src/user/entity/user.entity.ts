import { ApiProperty } from '@nestjs/swagger';
import { BaseCollection } from '../../common/entity/base.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  Unique,
} from 'typeorm';
import { UserType } from '../../common/enum/user-type.enum';
import { AuthProvider } from '../../common/enum/auth-provider.enum';
import * as bcrypt from 'bcrypt';

@Entity('user')
@Unique(['email'])
@Index(['providerId'])
@Index(['active', 'email'])
export class User extends BaseCollection {
  @ApiProperty({
    type: String,
    description: 'Email do usuário',
    example: 'usuario@email.com',
  })
  @Column({ type: 'varchar' })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Senha do usuário',
  })
  @Column({ default: null, select: false })
  password: string;

  @ApiProperty({
    type: String,
    description: 'Nome do usuário',
    example: 'Joao Silva',
  })
  @Column({ type: 'varchar', nullable: true, default: null })
  name: string;

  @ApiProperty({
    enum: UserType,
    description: 'Define o tipo de usuário',
    example: UserType.USER,
  })
  @Column({ type: 'enum', enum: UserType, default: UserType.USER })
  userType: UserType;

  @ApiProperty({
    type: Date,
    description: 'Primeiro login do usuário',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true, default: null })
  firstLogin?: Date;

  @ApiProperty({
    type: Date,
    description: 'Último login do usuário',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true, default: null })
  lastLogin?: Date;

  @ApiProperty({
    enum: AuthProvider,
    description: 'Provedor de autenticação',
    example: AuthProvider.LOCAL,
  })
  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider: AuthProvider;

  @ApiProperty({
    type: String,
    description: 'ID do usuário no provedor externo (Supabase)',
    example: 'abc123-def456',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true, default: null })
  providerId: string | null;

  @ApiProperty({
    type: String,
    description: 'URL do avatar do usuário',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true, default: null })
  avatarUrl: string | null;

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if (
      this.password &&
      this.password !== undefined &&
      this.password !== null
    ) {
      this.password = bcrypt.hashSync(this.password, 10);
    }
  }

  checkPassword = (attempt: string) => {
    if (!this.password) return false;
    return bcrypt.compareSync(attempt, this.password);
  };
}
