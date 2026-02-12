import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { JwtPayload, JwtResponse } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { PasswordResetToken } from './entity/password-reset-token.entity';
import { RefreshToken } from './entity/refresh-token.entity';
import {
  APP_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../common/constants';
import { ConfigService } from '@nestjs/config';
import { EmailClientService } from '../common/services/email-client.service';
import { getSupabaseClient } from '../config/supabase.config';
import { AuthProvider } from '../common/enum/auth-provider.enum';
import { LoginResponse } from './interfaces/login-response.interface';
import { LoginAttemptService } from './services/login-attempt.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailClient: EmailClientService,
    private loginAttemptService: LoginAttemptService,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUserByPassword(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const lockStatus = await this.loginAttemptService.isAccountLocked(
      loginDto.email,
    );

    if (lockStatus.locked) {
      const remainingMinutes = Math.ceil(lockStatus.remainingMs / 60000);
      throw new ForbiddenException(
        `Conta bloqueada. Tente novamente em ${remainingMinutes} minutos.`,
      );
    }

    let userToAttempt: User;
    try {
      userToAttempt = await this.userService.checkUserToLogin(loginDto.email);
    } catch {
      await this.loginAttemptService.recordAttempt(
        loginDto.email,
        false,
        ipAddress,
        userAgent,
      );
      throw new ForbiddenException(ERROR_MESSAGES.USER.INVALID_CREDENTIALS);
    }

    const isPasswordValid = userToAttempt.checkPassword(loginDto.password);

    if (!isPasswordValid) {
      await this.loginAttemptService.recordAttempt(
        loginDto.email,
        false,
        ipAddress,
        userAgent,
      );
      throw new ForbiddenException(ERROR_MESSAGES.USER.INVALID_PASSWORD);
    }

    await this.loginAttemptService.recordAttempt(
      loginDto.email,
      true,
      ipAddress,
      userAgent,
    );

    return this.createAuthTokens(userToAttempt, userAgent, ipAddress);
  }

  async createAuthTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const payload: JwtPayload = {
      email: user.email,
      userId: user.id,
      name: user.name,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn:
        this.configService.get<number>('EXPIRE_IN') ||
        APP_CONSTANTS.JWT.DEFAULT_EXPIRATION,
      userId: user.id,
      name: user.name,
      userType: user.userType,
    };
  }

  private async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresIn =
      this.configService.get<number>('REFRESH_EXPIRE_IN') ||
      APP_CONSTANTS.JWT.REFRESH_EXPIRATION;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const deviceInfo = this.parseDeviceInfo(userAgent);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
      sessionId,
      deviceInfo,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private parseDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Dispositivo desconhecido';

    const browserMatch = userAgent.match(
      /(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s](\d+)/i,
    );
    const osMatch = userAgent.match(
      /(Windows|Mac OS|Linux|Android|iOS|iPhone|iPad)[^\s;)]*/i,
    );

    const browser = browserMatch ? browserMatch[1] : 'Navegador desconhecido';
    const os = osMatch ? osMatch[1].replace('_', ' ') : 'SO desconhecido';

    return `${browser} em ${os}`;
  }

  async refreshAccessToken(
    refreshTokenValue: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshTokenValue,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    await this.refreshTokenRepository.update(refreshToken.id, {
      revoked: true,
    });

    const user = await this.userService.getUserById(refreshToken.userId);

    return this.createAuthTokens(user, userAgent, ipAddress);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { revoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
    return result.affected || 0;
  }

  async createJwtPayload(user: User): Promise<JwtResponse> {
    const data: JwtPayload = {
      email: user.email,
      userId: user.id,
      name: user.name,
      userType: user.userType,
    };

    const jwt = this.jwtService.sign(data);

    return {
      expiresIn:
        this.configService.get<number>('EXPIRE_IN') ||
        APP_CONSTANTS.JWT.DEFAULT_EXPIRATION,
      token: jwt,
      userId: user.id,
      name: user.name,
      userType: user.userType,
    };
  }

  async validateUserByJwt(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userService.checkUserToLogin(payload.email);
    if (user) {
      return {
        email: user.email,
        userId: user.id,
        name: user.name,
        userType: user.userType,
      };
    }
    throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return { message: SUCCESS_MESSAGES.AUTH.RESET_TOKEN_SENT };
    }

    await this.passwordResetTokenRepository.update(
      { userId: user.id, used: false },
      { used: true },
    );

    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + APP_CONSTANTS.RESET_PASSWORD.TOKEN_EXPIRATION,
    );

    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    await this.emailClient.sendPasswordReset(user.email, user.name, token);

    const nodeEnv = this.configService.get('NODE_ENV');
    if (nodeEnv === 'local' || nodeEnv === 'development') {
      return {
        message: SUCCESS_MESSAGES.AUTH.RESET_TOKEN_SENT,
        token,
      };
    }

    return { message: SUCCESS_MESSAGES.AUTH.RESET_TOKEN_SENT };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!resetToken) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.RESET_TOKEN_INVALID);
    }

    await this.passwordResetTokenRepository.update(resetToken.id, {
      used: true,
    });

    await this.userService.updatePassword(resetToken.userId, newPassword);

    await this.revokeAllUserTokens(resetToken.userId);

    return { message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET };
  }

  async loginWithSocialProvider(
    accessToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const supabase = getSupabaseClient(this.configService);

    if (!supabase) {
      throw new BadRequestException(
        ERROR_MESSAGES.AUTH.SOCIAL_LOGIN_NOT_CONFIGURED,
      );
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_SOCIAL_TOKEN);
    }

    const supabaseUser = data.user;
    const provider = this.mapSupabaseProvider(
      supabaseUser.app_metadata?.provider,
    );

    const user = await this.userService.createOrUpdateSocialUser({
      email: supabaseUser.email,
      name:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email.split('@')[0],
      providerId: supabaseUser.id,
      authProvider: provider,
      avatarUrl:
        supabaseUser.user_metadata?.avatar_url ||
        supabaseUser.user_metadata?.picture,
    });

    return this.createAuthTokens(user, userAgent, ipAddress);
  }

  private mapSupabaseProvider(provider: string): AuthProvider {
    const providerMap: Record<string, AuthProvider> = {
      google: AuthProvider.GOOGLE,
      azure: AuthProvider.MICROSOFT,
      facebook: AuthProvider.FACEBOOK,
      github: AuthProvider.GITHUB,
    };

    return providerMap[provider] || AuthProvider.LOCAL;
  }
}
