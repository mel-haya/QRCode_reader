import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { QrGateway } from './qr.gateway';

@Module({
  controllers: [QrController],
  providers: [QrService, QrGateway],
})
export class QrModule {}
