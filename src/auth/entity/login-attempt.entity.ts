import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseCollection } from '../../common/entity/base.entity';

@Entity('login_attempt')
@Index(['email', 'createdAt'])
@Index(['ipAddress'])
export class LoginAttempt extends BaseCollection {
  @ApiProperty({
    type: String,
    description: 'Email usado na tentativa de login',
  })
  @Column({ type: 'varchar' })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Endereço IP da tentativa',
  })
  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @ApiProperty({
    type: String,
    description: 'User agent do navegador',
  })
  @Column({ type: 'varchar', nullable: true })
  userAgent: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indica se a tentativa foi bem-sucedida',
  })
  @Column({ type: 'boolean', default: false })
  successful: boolean;
}
