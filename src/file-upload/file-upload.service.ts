import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../config/supabase.config';
import { FileRecord } from './entity/file-record.entity';
import {
  ERROR_MESSAGES,
  APP_CONSTANTS,
} from '../common/constants/app.constants';
import { UploadResult } from './interfaces/upload-result.interface';

const CACHE_PREFIX = 'file:';

@Injectable()
export class FileUploadService {
  private readonly bucketName: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileRecord)
    private readonly fileRepository: Repository<FileRecord>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.bucketName =
      this.configService.get<string>('SUPABASE_BUCKET') || 'uploads';
    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
  }

  async upload(
    file: Express.Multer.File,
    userId: string,
    folder?: string,
  ): Promise<UploadResult> {
    const supabase = getSupabaseClient(this.configService);

    if (!supabase) {
      throw new BadRequestException(ERROR_MESSAGES.FILE.STORAGE_NOT_CONFIGURED);
    }

    this.validateFile(file);

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

    const fileRecord = this.fileRepository.create({
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
      url: publicUrl,
      bucket: this.bucketName,
      uploadedById: userId,
    });

    await this.fileRepository.save(fileRecord);

    return {
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      url: fileRecord.url,
      path: fileRecord.path,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    userId: string,
    folder?: string,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.upload(file, userId, folder);
      results.push(result);
    }

    return results;
  }

  async delete(fileId: string, userId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, uploadedById: userId, active: true },
    });

    if (!file) {
      throw new NotFoundException(ERROR_MESSAGES.FILE.NOT_FOUND);
    }

    const supabase = getSupabaseClient(this.configService);

    if (supabase) {
      await supabase.storage.from(file.bucket).remove([file.path]);
    }

    file.active = false;
    file.deleteAt = new Date().toISOString();
    await this.fileRepository.save(file);

    await this.invalidateFileCache(fileId, userId);
  }

  private async invalidateFileCache(
    fileId: string,
    userId: string,
  ): Promise<void> {
    // Invalidar cache do arquivo específico
    await this.cacheManager.del(`${CACHE_PREFIX}id:${fileId}`);
    // Invalidar cache de listagem do usuário (paginações comuns)
    // Invalidamos as primeiras páginas mais acessadas
    const commonPaginations = [
      `${CACHE_PREFIX}user:${userId}:10:0`,
      `${CACHE_PREFIX}user:${userId}:20:0`,
      `${CACHE_PREFIX}user:${userId}:10:10`,
      `${CACHE_PREFIX}user:${userId}:20:20`,
    ];
    await Promise.all(
      commonPaginations.map((key) => this.cacheManager.del(key)),
    );
  }

  async getFileById(fileId: string): Promise<FileRecord> {
    const cacheKey = `${CACHE_PREFIX}id:${fileId}`;

    const cached = await this.cacheManager.get<FileRecord>(cacheKey);
    if (cached) {
      return cached;
    }

    const file = await this.fileRepository.findOne({
      where: { id: fileId, active: true },
    });

    if (!file) {
      throw new NotFoundException(ERROR_MESSAGES.FILE.NOT_FOUND);
    }

    await this.cacheManager.set(cacheKey, file, APP_CONSTANTS.CACHE.FILE_TTL);

    return file;
  }

  async getFilesByUser(
    userId: string,
    take = 10,
    skip = 0,
  ): Promise<{ items: FileRecord[]; total: number }> {
    const cacheKey = `${CACHE_PREFIX}user:${userId}:${take}:${skip}`;

    const cached = await this.cacheManager.get<{
      items: FileRecord[];
      total: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [items, total] = await this.fileRepository.findAndCount({
      where: { uploadedById: userId, active: true },
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    const result = { items, total };
    await this.cacheManager.set(cacheKey, result, APP_CONSTANTS.CACHE.FILE_TTL);

    return result;
  }

  async getSignedUrl(fileId: string, expiresIn = 3600): Promise<string> {
    const file = await this.getFileById(fileId);
    const supabase = getSupabaseClient(this.configService);

    if (!supabase) {
      return file.url;
    }

    const { data, error } = await supabase.storage
      .from(file.bucket)
      .createSignedUrl(file.path, expiresIn);

    if (error) {
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }

    return data.signedUrl;
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        ERROR_MESSAGES.FILE.SIZE_EXCEEDED.replace(
          '{size}',
          `${this.maxFileSize / (1024 * 1024)}MB`,
        ),
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_MESSAGES.FILE.INVALID_TYPE);
    }
  }
}
