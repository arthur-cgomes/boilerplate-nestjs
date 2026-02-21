jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-v4'),
}));

jest.mock('../../config/supabase.config', () => ({
  getSupabaseClient: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FileUploadService } from '../file-upload.service';
import { FileRecord } from '../entity/file-record.entity';
import {
  MockRepository,
  MockCacheManager,
  repositoryMockFactory,
  cacheManagerMockFactory,
} from '../../common/utils/test.util';
import {
  mockMulterFile,
  mockMulterFilePDF,
  mockMulterFileLarge,
  mockMulterFileInvalidType,
  mockFileRecord,
} from './mocks/file-upload.mock';
import { getSupabaseClient } from '../../config/supabase.config';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let repositoryMock: MockRepository<FileRecord>;

  let cacheManagerMock: MockCacheManager;
  let configService: { get: jest.Mock };
  let mockSupabase: {
    storage: {
      from: jest.Mock;
    };
  };

  beforeAll(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          SUPABASE_BUCKET: 'uploads',
          MAX_FILE_SIZE: 10 * 1024 * 1024,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: getRepositoryToken(FileRecord),
          useValue: repositoryMockFactory<FileRecord>(),
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMockFactory(),
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    repositoryMock = module.get(getRepositoryToken(FileRecord));
    cacheManagerMock = module.get(CACHE_MANAGER);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: {
              publicUrl:
                'https://example.com/storage/uploads/mocked-uuid-v4.jpg',
            },
          }),
          remove: jest.fn().mockResolvedValue({ error: null }),
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: 'https://example.com/signed/url' },
            error: null,
          }),
        }),
      },
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should use default values when config not set', async () => {
    const nullConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: getRepositoryToken(FileRecord),
          useValue: repositoryMockFactory<FileRecord>(),
        },
        {
          provide: ConfigService,
          useValue: nullConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMockFactory(),
        },
      ],
    }).compile();

    const serviceWithDefaults =
      module.get<FileUploadService>(FileUploadService);
    expect(serviceWithDefaults).toBeDefined();
  });

  describe('upload', () => {
    it('Should upload a file successfully', async () => {
      repositoryMock.create.mockReturnValue(mockFileRecord);
      repositoryMock.save.mockResolvedValue(mockFileRecord);

      const result = await service.upload(mockMulterFile, 'user-uuid-1');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('uploads');
      expect(repositoryMock.create).toHaveBeenCalled();
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('url');
    });

    it('Should upload file to a specific folder', async () => {
      repositoryMock.create.mockReturnValue(mockFileRecord);
      repositoryMock.save.mockResolvedValue(mockFileRecord);

      await service.upload(mockMulterFile, 'user-uuid-1', 'avatars');

      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        'avatars/mocked-uuid-v4.jpg',
        mockMulterFile.buffer,
        expect.any(Object),
      );
    });

    it('Should throw BadRequestException when storage not configured', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      await expect(
        service.upload(mockMulterFile, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should throw BadRequestException when file size exceeds limit', async () => {
      await expect(
        service.upload(mockMulterFileLarge, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should throw BadRequestException when file type is invalid', async () => {
      await expect(
        service.upload(mockMulterFileInvalidType, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should throw BadRequestException when upload fails', async () => {
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(
        service.upload(mockMulterFile, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should upload PDF file successfully', async () => {
      repositoryMock.create.mockReturnValue({
        ...mockFileRecord,
        mimeType: 'application/pdf',
      });
      repositoryMock.save.mockResolvedValue({
        ...mockFileRecord,
        mimeType: 'application/pdf',
      });

      const result = await service.upload(mockMulterFilePDF, 'user-uuid-1');

      expect(result.mimeType).toBe('application/pdf');
    });
  });

  describe('uploadMultiple', () => {
    it('Should upload multiple files successfully', async () => {
      repositoryMock.create.mockReturnValue(mockFileRecord);
      repositoryMock.save.mockResolvedValue(mockFileRecord);

      const files = [mockMulterFile, mockMulterFilePDF];
      const results = await service.uploadMultiple(files, 'user-uuid-1');

      expect(results).toHaveLength(2);
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledTimes(2);
    });

    it('Should upload to a specific folder', async () => {
      repositoryMock.create.mockReturnValue(mockFileRecord);
      repositoryMock.save.mockResolvedValue(mockFileRecord);

      const files = [mockMulterFile];
      await service.uploadMultiple(files, 'user-uuid-1', 'documents');

      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        'documents/mocked-uuid-v4.jpg',
        mockMulterFile.buffer,
        expect.any(Object),
      );
    });
  });

  describe('delete', () => {
    it('Should soft delete a file', async () => {
      repositoryMock.findOne.mockResolvedValue({ ...mockFileRecord });
      repositoryMock.save.mockResolvedValue({
        ...mockFileRecord,
        active: false,
      });

      await service.delete('file-uuid-1', 'user-uuid-1');

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1', uploadedById: 'user-uuid-1', active: true },
      });
      expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith([
        mockFileRecord.path,
      ]);
      expect(repositoryMock.save).toHaveBeenCalled();
    });

    it('Should throw NotFoundException when file not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.delete('non-existent-id', 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Should delete file even when Supabase is not configured', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);
      repositoryMock.findOne.mockResolvedValue({ ...mockFileRecord });
      repositoryMock.save.mockResolvedValue({
        ...mockFileRecord,
        active: false,
      });

      await service.delete('file-uuid-1', 'user-uuid-1');

      expect(repositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('getFileById', () => {
    it('Should return a file by ID from database and cache it', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(mockFileRecord);

      const result = await service.getFileById('file-uuid-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith('file:id:file-uuid-1');
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1', active: true },
      });
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        'file:id:file-uuid-1',
        mockFileRecord,
        60000,
      );
      expect(result).toEqual(mockFileRecord);
    });

    it('Should return file from cache when available', async () => {
      cacheManagerMock.get.mockResolvedValue(mockFileRecord);

      const result = await service.getFileById('file-uuid-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith('file:id:file-uuid-1');
      expect(repositoryMock.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockFileRecord);
    });

    it('Should throw NotFoundException when file not found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getFileById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFilesByUser', () => {
    it('Should return paginated files from database and cache it', async () => {
      const files = [mockFileRecord];
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findAndCount.mockResolvedValue([files, 1]);

      const result = await service.getFilesByUser('user-uuid-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        'file:user:user-uuid-1:10:0',
      );
      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        where: { uploadedById: 'user-uuid-1', active: true },
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        'file:user:user-uuid-1:10:0',
        { items: files, total: 1 },
        60000,
      );
      expect(result.items).toEqual(files);
      expect(result.total).toBe(1);
    });

    it('Should return files from cache when available', async () => {
      const cachedResult = { items: [mockFileRecord], total: 1 };
      cacheManagerMock.get.mockResolvedValue(cachedResult);

      const result = await service.getFilesByUser('user-uuid-1');

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        'file:user:user-uuid-1:10:0',
      );
      expect(repositoryMock.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('Should use custom pagination params', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      await service.getFilesByUser('user-uuid-1', 20, 10);

      expect(cacheManagerMock.get).toHaveBeenCalledWith(
        'file:user:user-uuid-1:20:10',
      );
      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        where: { uploadedById: 'user-uuid-1', active: true },
        take: 20,
        skip: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('Should return empty array when no files found', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      repositoryMock.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getFilesByUser('user-uuid-1');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getSignedUrl', () => {
    it('Should return a signed URL', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFileRecord);

      const result = await service.getSignedUrl('file-uuid-1');

      expect(mockSupabase.storage.from().createSignedUrl).toHaveBeenCalledWith(
        mockFileRecord.path,
        3600,
      );
      expect(result).toBe('https://example.com/signed/url');
    });

    it('Should use custom expiration time', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFileRecord);

      await service.getSignedUrl('file-uuid-1', 7200);

      expect(mockSupabase.storage.from().createSignedUrl).toHaveBeenCalledWith(
        mockFileRecord.path,
        7200,
      );
    });

    it('Should return public URL when Supabase not configured', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);
      repositoryMock.findOne.mockResolvedValue(mockFileRecord);

      const result = await service.getSignedUrl('file-uuid-1');

      expect(result).toBe(mockFileRecord.url);
    });

    it('Should throw BadRequestException when signed URL generation fails', async () => {
      repositoryMock.findOne.mockResolvedValue(mockFileRecord);
      mockSupabase.storage.from().createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create signed URL' },
      });

      await expect(service.getSignedUrl('file-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
