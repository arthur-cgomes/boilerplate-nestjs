import { FeatureFlag } from '../../entity/feature-flag.entity';
import { CreateFeatureFlagDto } from '../../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../../dto/update-feature-flag.dto';
import { FeatureFlagContext } from '../../interfaces/feature-flag-context.interface';

const baseCollectionFields = {
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deleteAt: null,
  createdBy: 'System Admin',
  createdById: 'admin-uuid-123',
  updatedBy: null,
  updatedById: null,
};

export const mockFeatureFlag: FeatureFlag = {
  ...baseCollectionFields,
  id: 'ff-uuid-1',
  key: 'new_dashboard',
  name: 'Novo Dashboard',
  description: 'Habilita o novo layout do dashboard',
  active: true,
  conditions: null,
  rolloutPercentage: 100,
  allowedUserIds: null,
  allowedUserTypes: null,
  allowedEnvironments: null,
  startDate: null,
  endDate: null,
} as FeatureFlag;

export const mockFeatureFlagDisabled: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-2',
  key: 'disabled_feature',
  name: 'Recurso Desabilitado',
  active: false,
} as FeatureFlag;

export const mockFeatureFlagWithRollout: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-3',
  key: 'partial_rollout',
  name: 'Rollout Parcial',
  rolloutPercentage: 50,
} as FeatureFlag;

export const mockFeatureFlagWithUserTypes: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-4',
  key: 'admin_only',
  name: 'Apenas Admin',
  allowedUserTypes: ['admin', 'global'],
} as FeatureFlag;

export const mockFeatureFlagWithDateRange: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-5',
  key: 'time_limited',
  name: 'Feature com Prazo',
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-12-31T23:59:59Z'),
} as FeatureFlag;

export const mockFeatureFlagFuture: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-6',
  key: 'future_feature',
  name: 'Recurso Futuro',
  startDate: new Date(Date.now() + 86400000),
} as FeatureFlag;

export const mockFeatureFlagExpired: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-7',
  key: 'expired_feature',
  name: 'Recurso Expirado',
  endDate: new Date(Date.now() - 86400000),
} as FeatureFlag;

export const mockFeatureFlagWithEnvironments: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-8',
  key: 'env_specific',
  name: 'Ambiente Específico',
  allowedEnvironments: ['production', 'staging'],
} as FeatureFlag;

export const mockFeatureFlagWithAllowedUsers: FeatureFlag = {
  ...mockFeatureFlag,
  id: 'ff-uuid-9',
  key: 'allowed_users',
  name: 'Usuários Permitidos',
  allowedUserIds: ['user-1', 'user-2'],
} as FeatureFlag;

export const mockCreateFeatureFlagDto: CreateFeatureFlagDto = {
  key: 'new_feature',
  name: 'Nova Feature',
  description: 'Descrição da nova feature',
  active: false,
  rolloutPercentage: 100,
};

export const mockUpdateFeatureFlagDto: UpdateFeatureFlagDto = {
  name: 'Feature Atualizada',
  active: true,
};

export const mockFeatureFlagContext: FeatureFlagContext = {
  userId: 'user-1',
  userType: 'user',
};

export const mockFeatureFlagContextAdmin: FeatureFlagContext = {
  userId: 'admin-1',
  userType: 'admin',
};
