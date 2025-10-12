import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { QrGateway } from './qr.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { QrCode, QrCodeSchema } from './schemas/qr-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: QrCode.name, schema: QrCodeSchema }]),
  ],
  controllers: [QrController],
  providers: [QrService, QrGateway],
})
export class QrModule {}
