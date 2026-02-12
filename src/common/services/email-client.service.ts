import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailPayload {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailClientService {
  private readonly logger = new Logger(EmailClientService.name);
  private readonly emailServiceUrl: string;
  private readonly emailServiceKey: string;

  constructor(private readonly configService: ConfigService) {
    this.emailServiceUrl = this.configService.get<string>('EMAIL_SERVICE_URL');
    this.emailServiceKey = this.configService.get<string>('EMAIL_SERVICE_KEY');
  }

  async send(payload: EmailPayload): Promise<EmailResponse> {
    if (!this.emailServiceUrl) {
      this.logger.warn('EMAIL_SERVICE_URL not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(this.emailServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.emailServiceKey && { 'x-api-key': this.emailServiceKey }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Email service error: ${errorData}`);
        return { success: false, error: errorData };
      }

      const data = await response.json();
      this.logger.log(`Email sent successfully to ${payload.to}`);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordReset(
    email: string,
    name: string,
    token: string,
  ): Promise<EmailResponse> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return this.send({
      to: email,
      template: 'password-reset',
      data: {
        name,
        token,
        resetUrl: `${frontendUrl}/reset-password?token=${token}`,
      },
    });
  }

  async sendWelcome(email: string, name: string): Promise<EmailResponse> {
    return this.send({
      to: email,
      template: 'welcome',
      data: { name },
    });
  }
}
