import { AuthTokens } from './auth-tokens.interface';

export interface LoginResponse extends AuthTokens {
  userId: string;
  name: string;
  userType: string;
}
