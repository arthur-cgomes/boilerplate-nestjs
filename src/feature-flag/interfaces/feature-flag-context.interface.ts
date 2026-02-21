import { UserType } from '../../common/enum/user-type.enum';

export interface FeatureFlagContext {
  userId?: string;
  userType?: UserType | string;
  environment?: string;
}
