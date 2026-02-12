import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Response } from 'express';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { userId?: string } | undefined;

    if (user?.userId) {
      return user.userId;
    }

    return req.ip as string;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader('X-RateLimit-Limit', throttlerLimitDetail.limit);
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, throttlerLimitDetail.limit - throttlerLimitDetail.totalHits),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil((Date.now() + throttlerLimitDetail.ttl) / 1000),
    );
    response.setHeader(
      'Retry-After',
      Math.ceil(throttlerLimitDetail.ttl / 1000),
    );

    return super.throwThrottlingException(context, throttlerLimitDetail);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context);
  }
}
