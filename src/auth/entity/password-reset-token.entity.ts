import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { BaseCollection } from '../../common/entity/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('password_reset_token')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
@Index(['used'])
@Index(['token', 'used', 'expiresAt'])
export class PasswordResetToken extends BaseCollection {
  @ApiProperty({
    type: String,
    description: 'Token para resetar a senha do usuário',
  })
  @Column({ type: 'varchar' })
  token: string;

  @ApiProperty({
    type: String,
    description: 'ID do usuário associado ao token de reset de senha',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    type: () => User,
    description: 'Usuário associado ao token de reset de senha',
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    type: Date,
    description: 'Data de expiração do token de reset de senha',
  })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({
    type: Boolean,
    description: 'Indica se o token já foi utilizado',
  })
  @Column({ type: 'boolean', default: false })
  used: boolean;
}
