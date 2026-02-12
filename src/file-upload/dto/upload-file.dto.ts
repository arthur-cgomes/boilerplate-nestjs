import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Pasta onde o arquivo será armazenado',
    example: 'avatars',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'ID do arquivo',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do arquivo gerado',
    example: 'a1b2c3d4-e5f6.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'minha-foto.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'URL pública do arquivo',
    example:
      'https://supabase.co/storage/v1/object/public/uploads/avatars/a1b2c3d4.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Caminho do arquivo no storage',
    example: 'avatars/a1b2c3d4-e5f6.jpg',
  })
  path: string;
}

export class SignedUrlResponseDto {
  @ApiProperty({
    description: 'URL assinada temporária',
    example:
      'https://supabase.co/storage/v1/object/sign/uploads/avatars/a1b2c3d4.jpg?token=...',
  })
  signedUrl: string;
}
