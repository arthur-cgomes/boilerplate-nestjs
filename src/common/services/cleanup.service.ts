import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { PasswordResetToken } from '../../auth/entity/password-reset-token.entity';
import { LoginAttempt } from '../../auth/entity/login-attempt.entity';

const RETENTION_DAYS = {
  REFRESH_TOKEN: 30,
  PASSWORD_RESET_TOKEN: 7,
  LOGIN_ATTEMPT: 30,
};

@Injectable()
export class CleanupService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup(): Promise<void> {
    this.logger.info('Iniciando limpeza de dados expirados', {
      context: 'CleanupService',
    });

    const results = await Promise.allSettled([
      this.cleanupRefreshTokens(),
      this.cleanupPasswordResetTokens(),
      this.cleanupLoginAttempts(),
    ]);

    results.forEach((result, index) => {
      const tasks = [
        'Refresh Tokens',
        'Password Reset Tokens',
        'Login Attempts',
      ];
      if (result.status === 'rejected') {
        this.logger.error(`Erro ao limpar ${tasks[index]}: ${result.reason}`, {
          context: 'CleanupService',
        });
      }
    });

    this.logger.info('Limpeza de dados expirados finalizada', {
      context: 'CleanupService',
    });
  }

  private async cleanupRefreshTokens(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS.REFRESH_TOKEN);

    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(cutoffDate),
    });

    const deleted = result.affected || 0;
    this.logger.info(`Refresh tokens expirados removidos: ${deleted}`, {
      context: 'CleanupService',
    });

    return deleted;
  }

  private async cleanupPasswordResetTokens(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - RETENTION_DAYS.PASSWORD_RESET_TOKEN,
    );

    const result = await this.passwordResetTokenRepository.delete({
      expiresAt: LessThan(cutoffDate),
    });

    const deleted = result.affected || 0;
    this.logger.info(`Password reset tokens expirados removidos: ${deleted}`, {
      context: 'CleanupService',
    });

    return deleted;
  }

  private async cleanupLoginAttempts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS.LOGIN_ATTEMPT);

    const result = await this.loginAttemptRepository.delete({
      createdAt: LessThan(cutoffDate.toISOString()),
    });

    const deleted = result.affected || 0;
    this.logger.info(`Login attempts antigos removidos: ${deleted}`, {
      context: 'CleanupService',
    });

    return deleted;
  }

  async runManualCleanup(): Promise<{
    refreshTokens: number;
    passwordResetTokens: number;
    loginAttempts: number;
  }> {
    const [refreshTokens, passwordResetTokens, loginAttempts] =
      await Promise.all([
        this.cleanupRefreshTokens(),
        this.cleanupPasswordResetTokens(),
        this.cleanupLoginAttempts(),
      ]);

    return {
      refreshTokens,
      passwordResetTokens,
      loginAttempts,
    };
  }
}
