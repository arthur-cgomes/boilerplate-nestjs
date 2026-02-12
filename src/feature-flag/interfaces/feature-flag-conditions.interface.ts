export interface FeatureFlagConditions {
  userTypes?: string[];
  environments?: string[];
  custom?: Record<string, unknown>;
}
