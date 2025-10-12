import sharp from 'sharp';
import jsQR from 'jsqr';

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

async function extractCells(url: string) {
  const image = sharp(url);

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
      const croppedImage = await sharp(url)
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
      const base64String = await sharp(url)
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
        output.push({ value: '', base64Image: '', status: 'failed' });
      }

      currentCol += 1;
    }
    currentRow += 1;
  }
  console.log('Extracted codes:', output);
  return output;
}

extractCells('test.png').catch(console.error);
