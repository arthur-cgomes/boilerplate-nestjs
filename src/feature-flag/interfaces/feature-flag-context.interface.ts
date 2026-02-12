import { UserType } from '../../common/enum';

export interface FeatureFlagContext {
  userId?: string;
  userType?: UserType | string;
  environment?: string;
}
