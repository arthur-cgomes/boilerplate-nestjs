import { FileRecord } from '../../entity/file-record.entity';

export const mockMulterFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'test-image.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('test'),
  size: 1024,
  stream: null,
  destination: '',
  filename: '',
  path: '',
};

export const mockMulterFilePDF: Express.Multer.File = {
  ...mockMulterFile,
  originalname: 'document.pdf',
  mimetype: 'application/pdf',
  size: 2048,
};

export const mockMulterFileLarge: Express.Multer.File = {
  ...mockMulterFile,
  size: 15 * 1024 * 1024, // 15MB
};

export const mockMulterFileInvalidType: Express.Multer.File = {
  ...mockMulterFile,
  originalname: 'script.exe',
  mimetype: 'application/x-executable',
};

export const mockFileRecord = {
  id: 'file-uuid-1',
  fileName: 'mocked-uuid-v4.jpg',
  originalName: 'test-image.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
  path: 'uploads/mocked-uuid-v4.jpg',
  url: 'https://example.com/storage/uploads/mocked-uuid-v4.jpg',
  bucket: 'uploads',
  uploadedById: 'user-uuid-1',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deleteAt: null,
  createdBy: null,
  createdById: null,
  updatedBy: null,
  updatedById: null,
} as unknown as FileRecord;

export const mockFileRecordDeleted = {
  ...mockFileRecord,
  id: 'file-uuid-2',
  active: false,
  deleteAt: '2024-01-02T00:00:00.000Z',
} as unknown as FileRecord;

export const mockUploadResult = {
  id: mockFileRecord.id,
  fileName: mockFileRecord.fileName,
  originalName: mockFileRecord.originalName,
  mimeType: mockFileRecord.mimeType,
  size: mockFileRecord.size,
  url: mockFileRecord.url,
  path: mockFileRecord.path,
};
