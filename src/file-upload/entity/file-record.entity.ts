import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseCollection } from '../../common/entity/base.entity';

@Entity('file_record')
@Index(['uploadedById'])
@Index(['createdAt'])
export class FileRecord extends BaseCollection {
  @ApiProperty({
    description: 'Nome do arquivo gerado',
    example: 'a1b2c3d4-e5f6.jpg',
  })
  @Column({ type: 'varchar' })
  fileName: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'minha-foto.jpg',
  })
  @Column({ type: 'varchar' })
  originalName: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  @Column({ type: 'varchar' })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  @Column({ type: 'bigint' })
  size: number;

  @ApiProperty({
    description: 'Caminho do arquivo no storage',
    example: 'avatars/a1b2c3d4-e5f6.jpg',
  })
  @Column({ type: 'varchar' })
  path: string;

  @ApiProperty({
    description: 'URL pública do arquivo',
    example:
      'https://supabase.co/storage/v1/object/public/uploads/avatars/a1b2c3d4.jpg',
  })
  @Column({ type: 'varchar' })
  url: string;

  @ApiProperty({
    description: 'Nome do bucket no storage',
    example: 'uploads',
  })
  @Column({ type: 'varchar' })
  bucket: string;

  @ApiProperty({
    description: 'ID do usuário que fez o upload',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @Column({ type: 'uuid' })
  uploadedById: string;
}
