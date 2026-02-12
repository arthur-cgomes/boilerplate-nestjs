import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuditLog } from './entity/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { AuditContextMiddleware } from './middleware/audit-context.middleware';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogSubscriber],
  exports: [AuditLogService],
})
export class AuditLogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
