import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { HealthCheckResponse } from './interfaces/health-check-response.interface';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';

@ApiTags('Health Check')
@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @ApiOperation({
    summary: 'Retorna o status da aplicação',
    description:
      'Verifica o status de saúde da aplicação, incluindo conexão com banco de dados e Redis.',
  })
  @ApiOkResponse({
    description: 'Status da aplicação retornado com sucesso',
    type: HealthCheckResponseDto,
  })
  async check(): Promise<HealthCheckResponse> {
    return await this.healthCheckService.execute();
  }
}
