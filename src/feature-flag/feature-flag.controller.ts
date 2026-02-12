import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagContext } from './interfaces/feature-flag-context.interface';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import {
  FeatureFlagStatusDto,
  FeatureFlagsStatusDto,
} from './dto/check-feature-flag.dto';
import { FeatureFlag } from './entity/feature-flag.entity';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserType } from '../common/enum/user-type.enum';
import { User } from '../user/entity/user.entity';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Post(':id/toggle')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar o status de uma feature flag' })
  @ApiParam({ name: 'id', description: 'ID da feature flag' })
  @ApiResponse({ status: 200, description: 'Status da feature flag alternado' })
  @ApiResponse({ status: 404, description: 'Feature flag não encontrada' })
  async toggle(@Param('id', ParseUUIDPipe) id: string): Promise<FeatureFlag> {
    return this.featureFlagService.toggle(id);
  }

  @Post()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag criada' })
  @ApiResponse({
    status: 409,
    description: 'Feature flag com esta chave já existe',
  })
  async create(@Body() dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    return this.featureFlagService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma feature flag' })
  @ApiParam({ name: 'id', description: 'ID da feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag atualizada' })
  @ApiResponse({ status: 404, description: 'Feature flag não encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag> {
    return this.featureFlagService.update(id, dto);
  }

  @Get('check/:key')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Verificar se uma feature flag está habilitada para o usuário atual',
  })
  @ApiParam({
    name: 'key',
    description: 'Chave da feature flag',
    example: 'new_dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da feature flag',
    type: FeatureFlagStatusDto,
  })
  async checkFlag(
    @Param('key') key: string,
    @CurrentUser() user: User,
  ): Promise<FeatureFlagStatusDto> {
    const context: FeatureFlagContext = {
      userId: user.id,
      userType: user.userType,
    };

    const active = await this.featureFlagService.isEnabled(key, context);
    return { key, active };
  }

  @Get('check')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter status de todas as feature flags para o usuário atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de todas as feature flags',
    type: FeatureFlagsStatusDto,
  })
  async checkAllFlags(
    @CurrentUser() user: User,
  ): Promise<FeatureFlagsStatusDto> {
    const context: FeatureFlagContext = {
      userId: user.id,
      userType: user.userType,
    };

    const flags = await this.featureFlagService.getAllFlagsForUser(context);
    return { flags };
  }

  @Get()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN, UserType.GLOBAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as feature flags' })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'Lista de feature flags' })
  async findAll(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ): Promise<GetAllResponseDto<FeatureFlag>> {
    return this.featureFlagService.findAll(take, skip);
  }

  @Get(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN, UserType.GLOBAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter uma feature flag por ID' })
  @ApiParam({ name: 'id', description: 'ID da feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag encontrada' })
  @ApiResponse({ status: 404, description: 'Feature flag não encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FeatureFlag> {
    return this.featureFlagService.findById(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover uma feature flag' })
  @ApiParam({ name: 'id', description: 'ID da feature flag' })
  @ApiResponse({ status: 204, description: 'Feature flag removida' })
  @ApiResponse({ status: 404, description: 'Feature flag não encontrada' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.featureFlagService.delete(id);
  }
}
