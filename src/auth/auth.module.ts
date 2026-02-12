import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailClientService } from '../common/services/email-client.service';
import { PasswordResetToken } from './entity/password-reset-token.entity';
import { RefreshToken } from './entity/refresh-token.entity';
import { LoginAttempt } from './entity/login-attempt.entity';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoginAttemptService } from './services/login-attempt.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('AUTH_SECRET');
        if (!secret) {
          throw new Error('AUTH_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<number>('EXPIRE_IN') || 7200,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([PasswordResetToken, RefreshToken, LoginAttempt]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenBlacklistService,
    LoginAttemptService,
    EmailClientService,
  ],
  exports: [AuthService, PassportModule, JwtModule, TokenBlacklistService],
})
export class AuthModule {}
