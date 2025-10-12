import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QrCodeDocument = QrCode & Document;

@Schema()
export class QrCode {
  @Prop({ required: true, trim: true })
  value: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  base64Image: string;
}

export const QrCodeSchema = SchemaFactory.createForClass(QrCode);
