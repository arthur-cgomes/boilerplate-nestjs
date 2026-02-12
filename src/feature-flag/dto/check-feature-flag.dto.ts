import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagStatusDto {
  @ApiProperty({
    description: 'Chave da feature flag',
    example: 'new_dashboard',
  })
  key: string;

  @ApiProperty({
    description: 'Se a feature esta habilitada para o usuario',
    example: true,
  })
  active: boolean;
}

export class FeatureFlagsStatusDto {
  @ApiProperty({
    description: 'Status de todas as feature flags para o usuario',
    type: 'object',
    additionalProperties: { type: 'boolean' },
    example: { new_dashboard: true, dark_mode: false },
  })
  flags: Record<string, boolean>;
}
