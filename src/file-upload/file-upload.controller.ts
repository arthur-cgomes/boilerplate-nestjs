import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { UploadResult } from './interfaces/upload-result.interface';
import { CurrentUser } from '../common/decorators';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  FileUploadResponseDto,
  SignedUrlResponseDto,
} from './dto/upload-file.dto';
import { FileRecord } from './entity/file-record.entity';
import { MessageResponseDto } from '../common/dto';

@ApiTags('File Upload')
@Controller('files')
@UseGuards(AuthGuard())
@ApiBearerAuth('JWT-auth')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de arquivo único' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Pasta onde o arquivo será armazenado',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Arquivo enviado com sucesso',
    type: FileUploadResponseDto,
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UploadResult> {
    return this.fileUploadService.upload(file, user.userId, folder);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload de múltiplos arquivos (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: 'Pasta onde os arquivos serão armazenados',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Arquivos enviados com sucesso',
    type: [FileUploadResponseDto],
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UploadResult[]> {
    return this.fileUploadService.uploadMultiple(files, user.userId, folder);
  }

  @Get()
  @ApiOperation({ summary: 'Listar arquivos do usuario' })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiOkResponse({ description: 'Lista de arquivos' })
  async getFiles(
    @CurrentUser() user: JwtPayload,
    @Query('take') take?: number,
    @Query('skip') skip?: number,
  ): Promise<{ items: FileRecord[]; total: number }> {
    return this.fileUploadService.getFilesByUser(user.userId, take, skip);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter arquivo por ID' })
  @ApiOkResponse({ type: FileRecord })
  async getFile(@Param('id', ParseUUIDPipe) id: string): Promise<FileRecord> {
    return this.fileUploadService.getFileById(id);
  }

  @Get(':id/signed-url')
  @ApiOperation({ summary: 'Gerar URL assinada temporária' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description: 'Tempo de expiração em segundos (padrão: 3600)',
  })
  @ApiOkResponse({ type: SignedUrlResponseDto })
  async getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<{ signedUrl: string }> {
    const signedUrl = await this.fileUploadService.getSignedUrl(id, expiresIn);
    return { signedUrl };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar arquivo' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.fileUploadService.delete(id, user.userId);
    return { message: 'Arquivo removido com sucesso' };
  }
}
