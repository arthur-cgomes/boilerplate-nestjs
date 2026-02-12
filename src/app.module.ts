import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UserThrottlerGuard } from './common/guards';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { GlobalExceptionFilter } from './common/filters';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  SensitiveFieldsInterceptor,
  CorrelationInterceptor,
} from './common/interceptors';
import { CleanupService } from './common/services/cleanup.service';
import { RefreshToken } from './auth/entity/refresh-token.entity';
import { PasswordResetToken } from './auth/entity/password-reset-token.entity';
import { LoginAttempt } from './auth/entity/login-attempt.entity';
import { envValidationSchema } from './config/env.validation';
import { winstonConfig } from './config/winston.config';
import { redisConfig } from './config/redis.config';
import { APP_CONSTANTS } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync(redisConfig),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl:
              configService.get<number>('THROTTLE_TTL') ||
              APP_CONSTANTS.RATE_LIMIT.TTL,
            limit:
              configService.get<number>('THROTTLE_LIMIT') ||
              APP_CONSTANTS.RATE_LIMIT.LIMIT,
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        port: configService.get('TYPEORM_PORT'),
        username: configService.get('TYPEORM_USERNAME'),
        password: configService.get('TYPEORM_PASSWORD'),
        database: configService.get('TYPEORM_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        extra: {
          max: configService.get('NODE_ENV') === 'production' ? 20 : 10,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken, LoginAttempt]),
    AuthModule,
    UserModule,
    HealthCheckModule,
    FileUploadModule,
    AuditLogModule,
    FeatureFlagModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(APP_CONSTANTS.TIMEOUT.DEFAULT),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveFieldsInterceptor,
    },
    CleanupService,
  ],
})
export class AppModule {}
