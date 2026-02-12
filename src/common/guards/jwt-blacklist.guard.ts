import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenBlacklistService } from '../../auth/services/token-blacklist.service';
import { ERROR_MESSAGES } from '../constants';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(private tokenBlacklistService: TokenBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true;
    }

    const token = authHeader.replace('Bearer ', '');

    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    return true;
  }
}
