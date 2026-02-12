import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLog } from './entity/audit-log.entity';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserType } from '../common/enum/user-type.enum';

@ApiTags('Audit Log')
@Controller('audit-log')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserType.ADMIN, UserType.GLOBAL)
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoria',
  })
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<GetAllResponseDto<AuditLog>> {
    return this.auditLogService.getAuditLogs(query);
  }

  @Get('entity/:entityName/:entityId')
  @Roles(UserType.ADMIN, UserType.GLOBAL)
  @ApiOperation({ summary: 'Obter histórico de alterações de uma entidade' })
  @ApiParam({
    name: 'entityName',
    description: 'Nome da entidade',
    example: 'User',
  })
  @ApiParam({ name: 'entityId', description: 'ID da entidade' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de alterações da entidade',
  })
  async getEntityHistory(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getEntityHistory(entityName, entityId);
  }

  @Get('user/:userId')
  @Roles(UserType.ADMIN, UserType.GLOBAL)
  @ApiOperation({ summary: 'Obter atividades de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de atividades do usuário',
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('take') take?: number,
  ): Promise<AuditLog[]> {
    return this.auditLogService.getUserActivity(userId, take);
  }
}
