import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HealthCheckModule } from './health-check/health-check.module';

config();

@Module({
  imports: [
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
      }),
    }),
    AuthModule,
    UserModule,
    HealthCheckModule,
  ],
  providers: [],
})
export class AppModule {}
