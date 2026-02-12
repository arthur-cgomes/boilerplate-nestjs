import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../feature-flag.service';
import { FeatureFlagContext } from '../interfaces/feature-flag-context.interface';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagKey = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!flagKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const flagContext: FeatureFlagContext = {
      userId: user?.id,
      userType: user?.userType,
    };

    const isEnabled = await this.featureFlagService.isEnabled(
      flagKey,
      flagContext,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Recurso nao disponivel. Feature '${flagKey}' nao esta habilitada.`,
      );
    }

    return true;
  }
}
