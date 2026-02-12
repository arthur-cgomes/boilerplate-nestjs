import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { FeatureFlagGuard } from '../guards/feature-flag.guard';

export const FEATURE_FLAG_KEY = 'featureFlag';

export const RequireFeatureFlag = (flagKey: string) =>
  applyDecorators(
    SetMetadata(FEATURE_FLAG_KEY, flagKey),
    UseGuards(FeatureFlagGuard),
  );
