import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { CORRELATION_ID_HEADER } from './correlation.interceptor';

@Injectable()
export class ResponseWrapperInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = request.headers[
      CORRELATION_ID_HEADER.toLowerCase()
    ] as string;

    return next.handle().pipe(
      map((data) => {
        if (data?.skip !== undefined && data?.total !== undefined) {
          return {
            success: true,
            data: data.items,
            meta: {
              total: data.total,
              skip: data.skip,
              take: data.items?.length || 0,
              correlationId,
            },
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data,
          meta: {
            correlationId,
          },
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
