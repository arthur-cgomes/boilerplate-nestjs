import { SetMetadata } from '@nestjs/common';

export const SKIP_SENSITIVE_FIELDS_KEY = 'skipSensitiveFields';
export const SkipSensitiveFields = () =>
  SetMetadata(SKIP_SENSITIVE_FIELDS_KEY, true);
