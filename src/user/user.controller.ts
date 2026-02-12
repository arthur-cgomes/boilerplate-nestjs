import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { GetAllResponseDto } from '../common/dto/get-all.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserType } from '../common/enum/user-type.enum';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo usuário',
  })
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({
    description: 'Usuário com este e-mail já existe',
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Put('me')
  @UseGuards(AuthGuard(), RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualiza o próprio usuário autenticado',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(user.userId, updateUserDto);
  }

  @Put(':userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualiza um usuário pelo id (apenas admin)',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiForbiddenResponse({
    description: 'Sem permissão para acessar este recurso',
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(userId, updateUserDto);
  }

  @Get('me')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retorna os dados do usuário autenticado',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return await this.userService.getUserById(user.userId);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Retorna um usuário pelo id',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async getUserById(@Param('userId') userId: string) {
    return await this.userService.getUserById(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Busca todos os usuários',
  })
  @ApiOkResponse({ type: GetAllResponseDto<User> })
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    const { take, skip, search, sort, order } = paginationDto;
    return await this.userService.getAllUsers(take, skip, search, sort, order);
  }

  @Delete('me')
  @UseGuards(AuthGuard())
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Exclui a própria conta do usuário autenticado',
  })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async deleteCurrentUser(@CurrentUser() user: JwtPayload) {
    return { message: await this.userService.deleteUser(user.userId) };
  }

  @Delete(':userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Exclui um usuário pelo id (apenas admin)',
  })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiForbiddenResponse({
    description: 'Sem permissão para acessar este recurso',
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async deleteUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (userId === currentUser.userId) {
      throw new ForbiddenException(
        'Não é possível excluir sua própria conta por esta rota',
      );
    }
    return { message: await this.userService.deleteUser(userId) };
  }
}
