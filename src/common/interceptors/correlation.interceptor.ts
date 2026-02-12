import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const correlationId =
      (request.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) ||
      randomUUID();

    request.headers[CORRELATION_ID_HEADER.toLowerCase()] = correlationId;

    return next.handle().pipe(
      tap(() => {
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
      }),
    );
  }
}
