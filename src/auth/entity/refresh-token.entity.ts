import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { BaseCollection } from '../../common/entity/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('refresh_token')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
@Index(['sessionId'])
@Index(['revoked'])
@Index(['token', 'revoked', 'expiresAt'])
@Index(['userId', 'revoked'])
export class RefreshToken extends BaseCollection {
  @ApiProperty({
    description: 'The refresh token string',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @Column({ type: 'varchar' })
  token: string;

  @ApiProperty({
    description: 'The ID of the user associated with this refresh token',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'The user associated with this refresh token',
    type: () => User,
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'The expiration date of the refresh token',
    example: '2024-12-31T23:59:59.000Z',
  })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({
    description: 'Indicates whether the refresh token has been revoked',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @ApiProperty({
    description: 'Unique session identifier for this device/browser',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @ApiProperty({
    description: 'Device information (e.g., browser, OS)',
    example: 'Chrome on Windows',
  })
  @Column({ type: 'varchar', nullable: true })
  deviceInfo?: string;

  @ApiProperty({
    description: 'The user agent string from which the token was issued',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  })
  @Column({ type: 'varchar', nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'The IP address from which the token was issued',
    example: '127.0.0.1',
  })
  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string;
}
