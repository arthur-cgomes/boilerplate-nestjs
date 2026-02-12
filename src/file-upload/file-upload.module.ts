import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import { FileRecord } from './entity/file-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileRecord]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
