import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_SENSITIVE_FIELDS_KEY } from '../decorators/skip-sensitive-fields.decorator';

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'secret',
  'apiKey',
  'privateKey',
];

@Injectable()
export class SensitiveFieldsInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipSensitiveFields = this.reflector.getAllAndOverride<boolean>(
      SKIP_SENSITIVE_FIELDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipSensitiveFields) {
      return next.handle();
    }

    return next.handle().pipe(map((data) => this.removeSensitiveFields(data)));
  }

  private removeSensitiveFields(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.removeSensitiveFields(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_FIELDS.includes(key)) {
          continue;
        }

        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.removeSensitiveFields(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return data;
  }
}
