import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

const SENSITIVE_ROUTES = ['/auth', '/auth/refresh', '/auth/reset-password'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    const isSensitiveRoute = SENSITIVE_ROUTES.some((route) =>
      url.startsWith(route),
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          const duration = Date.now() - now;

          const logUrl = isSensitiveRoute ? this.maskSensitiveUrl(url) : url;

          this.logger.log(
            `${method} ${logUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          const logUrl = isSensitiveRoute ? this.maskSensitiveUrl(url) : url;

          this.logger.error(
            `${method} ${logUrl} - ${userAgent} ${ip} - ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private maskSensitiveUrl(url: string): string {
    const [path] = url.split('?');
    return path;
  }
}
