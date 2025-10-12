import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { QrGateway } from './qr.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { QrCode, QrCodeDocument } from './schemas/qr-code.schema';
import { Model } from 'mongoose';

interface JsQrResult {
  data: string;
  location?: unknown;
}

interface ExtractedCode {
  value: string;
  base64Image: string;
  status: string;
}

function typedJsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): JsQrResult | null {
  // jsQR has untyped exports in this environment; cast the call result.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return jsQR(data, width, height) as JsQrResult | null;
}

const MARGIN_LEFT = 45;
const MARGIN_TOP = 96;
const CELL_SIZE = 94;
const VERT_GAP = 84;
const HORZ_GAP = 9;

@Injectable()
export class QrService {
  constructor(
    private readonly qrGateway: QrGateway,
    @InjectModel(QrCode.name) private qrCodeModel: Model<QrCodeDocument>,
  ) {}
  async extractCells(buffer: Buffer) {
    const image = sharp(buffer);

    const output: ExtractedCode[] = [];
    const metadata = await image.metadata();
    const imageWidth = metadata.width ?? 0;
    const imageHeight = metadata.height ?? 0;

    let currentRow = 0;
    while (currentRow < 4) {
      let currentCol = 0;
      while (currentCol < 5) {
        const left = MARGIN_LEFT + currentCol * (CELL_SIZE + HORZ_GAP);
        const top = MARGIN_TOP + currentRow * (CELL_SIZE + VERT_GAP);

        // Clamp width/height if crop is near edges
        const availableWidth = Math.max(0, imageWidth - left);
        const availableHeight = Math.max(0, imageHeight - top);
        const cropWidth = Math.min(CELL_SIZE, availableWidth);
        const cropHeight = Math.min(CELL_SIZE, availableHeight);

        if (cropWidth <= 0 || cropHeight <= 0) {
          console.warn(
            'Skipping empty crop at',
            left,
            top,
            cropWidth,
            cropHeight,
          );
          currentCol += 1;
          continue;
        }

        // Clone pipeline for each extract to avoid reusing same stream
        const croppedImage = await sharp(buffer)
          .extract({ left, top, width: cropWidth, height: cropHeight })
          .raw()
          .toBuffer({ resolveWithObject: true });

        // info contains width, height, channels
        const clamped = new Uint8ClampedArray(croppedImage.data);

        // jsQR expects width and height matching the buffer
        const decodedQR = typedJsQR(
          clamped,
          croppedImage.info.width,
          croppedImage.info.height,
        );
        const base64String = await sharp(buffer)
          .extract({ left, top, width: cropWidth, height: cropHeight })
          .toBuffer({ resolveWithObject: true });

        if (decodedQR && typeof decodedQR.data === 'string') {
          output.push({
            value: decodedQR.data,
            base64Image:
              'data:image/png;base64,' + base64String.data.toString('base64'),
            status: 'success',
          });
        } else {
          output.push({
            value: '',
            base64Image:
              'data:image/png;base64,' + base64String.data.toString('base64'),
            status: 'failed',
          });
        }

        currentCol += 1;
      }
      currentRow += 1;
    }
    return output;
  }

  async scanImageForQrCodes(
    pages: string[],
    clientId: string,
  ): Promise<ExtractedCode[]> {
    const ret: ExtractedCode[] = [];
    let currentPage = 0;
    const totalPages = pages.length;
    while (currentPage < totalPages) {
      const base64Data = pages[currentPage].split(';base64,').pop();
      this.qrGateway.sendProgressUpdate(clientId, {
        currentPage: currentPage + 1,
        totalPages,
      });
      if (!base64Data) {
        throw new Error('Invalid base64 string format');
      }
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const values = await this.extractCells(imageBuffer);
      ret.push(...values);

      const successfulScans = values.filter(
        code => code.status === 'success' && code.value,
      );
      if (successfulScans.length > 0) {
        const codesToSave = successfulScans.map(scan => ({
          value: scan.value,
          base64Image: scan.base64Image,
        }));
        await this.qrCodeModel.insertMany(codesToSave);
      }
      currentPage++;
    }
    this.qrGateway.sendScanComplete(clientId, {
      totalPages,
      foundCodes: ret.length,
    });
    return ret;
  }
}
