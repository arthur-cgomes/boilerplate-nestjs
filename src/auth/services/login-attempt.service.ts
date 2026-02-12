import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginAttempt } from '../entity/login-attempt.entity';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async recordAttempt(
    email: string,
    successful: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const attempt = this.loginAttemptRepository.create({
      email,
      successful,
      ipAddress,
      userAgent,
    });
    await this.loginAttemptRepository.save(attempt);

    if (successful) {
      await this.clearFailedAttempts(email);
    }
  }

  async isAccountLocked(
    email: string,
  ): Promise<{ locked: boolean; remainingMs?: number }> {
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

    const failedAttempts = await this.loginAttemptRepository.count({
      where: {
        email,
        successful: false,
        createdAt: MoreThan(windowStart.toISOString()),
      },
    });

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lastAttempt = await this.loginAttemptRepository.findOne({
        where: {
          email,
          successful: false,
        },
        order: { createdAt: 'DESC' },
      });

      if (lastAttempt) {
        const lockoutEnd = new Date(
          new Date(lastAttempt.createdAt).getTime() + LOCKOUT_DURATION_MS,
        );
        const now = new Date();

        if (now < lockoutEnd) {
          return {
            locked: true,
            remainingMs: lockoutEnd.getTime() - now.getTime(),
          };
        }
      }
    }

    return { locked: false };
  }

  async getRecentFailedAttempts(email: string): Promise<number> {
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

    return this.loginAttemptRepository.count({
      where: {
        email,
        successful: false,
        createdAt: MoreThan(windowStart.toISOString()),
      },
    });
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    await this.loginAttemptRepository.delete({
      email,
      successful: false,
    });
  }
}
