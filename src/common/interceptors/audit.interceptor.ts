import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

interface RequestWithUser {
  user?: { userId?: string; name?: string };
  body?: Record<string, unknown>;
  method: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user && request.body && typeof request.body === 'object') {
      const method = request.method;

      if (method === 'POST') {
        request.body.createdById = user.userId;
        request.body.createdBy = user.name;
      }

      if (method === 'PUT' || method === 'PATCH') {
        request.body.updatedById = user.userId;
        request.body.updatedBy = user.name;
      }
    }

    return next.handle();
  }
}
