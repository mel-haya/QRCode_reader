import { Controller, Post, Body } from '@nestjs/common';
import { QrService } from './qr.service';
import type { ImagesUploadRequest } from './dto/upload-images';

interface UploadResponse {
  message: string;
  code?: any;
}

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  // Accept an array of base64-encoded PNG images in JSON body
  @Post('upload-images')
  async uploadImages(
    @Body() body: ImagesUploadRequest,
  ): Promise<UploadResponse> {
    const images = body?.images;
    const socketId = body?.socketId;
    console.log('Received socketId:', socketId);
    if (!images || !Array.isArray(images) || images.length === 0) {
      return {
        message: 'No images provided',
        code: '',
      };
    }

    const processed = await this.qrService.scanImageForQrCodes(
      images,
      socketId,
    );

    return {
      message: 'Images processed successfully',
      code: processed,
    };
  }
}
