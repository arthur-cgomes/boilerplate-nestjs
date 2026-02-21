import {
  Body,
  Controller,
  Headers,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginResponse } from './interfaces/login-response.interface';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  APP_CONSTANTS,
  SUCCESS_MESSAGES,
} from '../common/constants/app.constants';
import {
  MessageResponseDto,
  PasswordResetRequestResponseDto,
} from '../common/dto/message-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  @Post('login')
  @Throttle({
    default: {
      limit: APP_CONSTANTS.RATE_LIMIT.LOGIN_LIMIT,
      ttl: APP_CONSTANTS.RATE_LIMIT.LOGIN_TTL,
    },
  })
  @ApiOperation({
    summary: 'Autenticação do usuário',
    description:
      'Permite que o usuário receba o seu token a partir do email e senha.',
  })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Senha inválida' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponse> {
    return this.authService.validateUserByPassword(
      loginDto,
      userAgent,
      ipAddress,
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Atualizar token de acesso',
    description: 'Gera um novo token de acesso usando o refresh token.',
  })
  @ApiOkResponse({
    description: 'Token atualizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponse> {
    return this.authService.refreshAccessToken(
      refreshTokenDto.refreshToken,
      userAgent,
      ipAddress,
    );
  }

  @Post('logout')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout do usuário',
    description: 'Revoga todos os refresh tokens e invalida o access token.',
  })
  @ApiOkResponse({
    description: 'Logout realizado com sucesso',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await this.tokenBlacklistService.blacklistToken(token);
    }

    await this.authService.revokeAllUserTokens(user.userId);

    return { message: SUCCESS_MESSAGES.AUTH.LOGOUT };
  }

  @Post('password/request-reset')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Envia um token de recuperação de senha para o email do usuário.',
  })
  @ApiOkResponse({
    description: 'Token de recuperação enviado',
    type: PasswordResetRequestResponseDto,
  })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string; token?: string }> {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email);
  }

  @Post('password/confirm-reset')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Confirmar recuperação de senha',
    description: 'Confirma a troca de senha usando o token recebido.',
  })
  @ApiOkResponse({
    description: 'Senha alterada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado' })
  async confirmPasswordReset(
    @Body() confirmPasswordResetDto: ConfirmPasswordResetDto,
  ): Promise<{ message: string }> {
    return this.authService.confirmPasswordReset(
      confirmPasswordResetDto.token,
      confirmPasswordResetDto.newPassword,
    );
  }

  @Post('social')
  @Throttle({
    default: {
      limit: APP_CONSTANTS.RATE_LIMIT.LOGIN_LIMIT,
      ttl: APP_CONSTANTS.RATE_LIMIT.LOGIN_TTL,
    },
  })
  @ApiOperation({
    summary: 'Login social (Google, Microsoft, Facebook, GitHub)',
    description:
      'Autentica o usuário usando o access token do Supabase obtido após login social no frontend.',
  })
  @ApiOkResponse({
    description: 'Login social realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Login social não configurado' })
  @ApiUnauthorizedResponse({ description: 'Token do provedor inválido' })
  async socialLogin(
    @Body() socialLoginDto: SocialLoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponse> {
    return this.authService.loginWithSocialProvider(
      socialLoginDto.accessToken,
      userAgent,
      ipAddress,
    );
  }

  @Post('logout-all')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout de todos os dispositivos',
    description:
      'Revoga todos os refresh tokens do usuário em todos os dispositivos.',
  })
  @ApiOkResponse({
    description: 'Logout de todos os dispositivos realizado com sucesso',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ): Promise<{ message: string; revokedCount: number }> {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await this.tokenBlacklistService.blacklistToken(token);
    }

    const revokedCount = await this.authService.revokeAllUserTokens(
      user.userId,
    );

    return {
      message: 'Logout de todos os dispositivos realizado com sucesso',
      revokedCount,
    };
  }
}
