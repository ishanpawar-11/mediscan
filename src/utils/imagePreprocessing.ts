/**
 * Image Pre-Processing Utilities for Robust Medicine-Strip Scanning
 * Features:
 * 1. Automatic Strip Detection & Focused Cropping
 * 2. 90°/180°/270° Orientation & Rotation Correction
 * 3. Optical Sharpness & Quality Scoring (discrete Laplacian gradient variance)
 * 4. Multi-variant enhancement:
 *    - Balanced Clinical View
 *    - Foil Anti-Glare & Highlight Suppression
 *    - Unsharp-mask Convolution for dot-matrix crimps & embossed text
 *    - Adaptive High Contrast / Denoise
 */

export interface PreprocessingOptions {
  contrast: number; // 100 (normal) to 180 (high contrast)
  sharpen: number;  // 0 (none), 1 (medium), 2 (high)
  brightness: number; // -30 to +30
  antiGlare: boolean; // Suppress reflective foil hot-spots
  denoise: boolean; // Mild low-pass filter
  autoCrop: boolean; // Automatically crop detected strip bounds
  rotation: number; // 0, 90, 180, 270
  maxDim?: number;   // Max dimension for OCR payload efficiency (default 1600)
}

export const DEFAULT_PREPROCESSING: PreprocessingOptions = {
  contrast: 130,
  sharpen: 1,
  brightness: 0,
  antiGlare: true,
  denoise: false,
  autoCrop: false,
  rotation: 0,
  maxDim: 1600,
};

export interface ProcessedVariant {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
  sharpness: number;
}

/**
 * Calculates sharpness score (0-100) using discrete Laplacian variance.
 * Used during multi-frame burst capture to auto-select the sharpest frame.
 */
export function calculateSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    const sampleW = Math.floor(width * 0.65);
    const sampleH = Math.floor(height * 0.65);
    const startX = Math.floor((width - sampleW) / 2);
    const startY = Math.floor((height - sampleH) / 2);

    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const data = imgData.data;

    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let count = 0;

    const step = 2;
    for (let y = 1; y < sampleH - 1; y += step) {
      for (let x = 1; x < sampleW - 1; x += step) {
        const idx = (y * sampleW + x) * 4;
        const lumCenter = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

        const idxRight = (y * sampleW + (x + 1)) * 4;
        const lumRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];

        const idxLeft = (y * sampleW + (x - 1)) * 4;
        const lumLeft = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];

        const idxDown = ((y + 1) * sampleW + x) * 4;
        const lumDown = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];

        const idxUp = ((y - 1) * sampleW + x) * 4;
        const lumUp = 0.299 * data[idxUp] + 0.587 * data[idxUp + 1] + 0.114 * data[idxUp + 2];

        const lap = Math.abs(4 * lumCenter - lumRight - lumLeft - lumDown - lumUp);
        laplacianSum += lap;
        laplacianSqSum += lap * lap;
        count++;
      }
    }

    if (count === 0) return 75;

    const mean = laplacianSum / count;
    const variance = (laplacianSqSum / count) - (mean * mean);

    const normalized = Math.min(99, Math.max(50, Math.round(50 + Math.sqrt(Math.max(0, variance)) * 3.5)));
    return normalized;
  } catch {
    return 75;
  }
}

/**
 * Detects the bounding rectangle of the medicine strip against a background.
 * If the detected strip occupies at least 25% of the frame and is bounded,
 * returns crop coordinates; otherwise returns null.
 */
export function detectStripBoundingBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | null {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Sample background brightness from corners
    const cornerSamples = [
      data[0] * 0.299 + data[1] * 0.587 + data[2] * 0.114,
      data[(width - 1) * 4] * 0.299 + data[(width - 1) * 4 + 1] * 0.587 + data[(width - 1) * 4 + 2] * 0.114,
      data[(height - 1) * width * 4] * 0.299 + data[(height - 1) * width * 4 + 1] * 0.587 + data[(height - 1) * width * 4 + 2] * 0.114,
      data[data.length - 4] * 0.299 + data[data.length - 3] * 0.587 + data[data.length - 2] * 0.114,
    ];
    const bgLuminance = cornerSamples.reduce((a, b) => a + b, 0) / 4;

    let minX = width, maxX = 0, minY = height, maxY = 0;
    let foregroundPixelCount = 0;

    const step = 4;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        const diff = Math.abs(lum - bgLuminance);

        // If pixel significantly differs from corner background
        if (diff > 28) {
          foregroundPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const totalSampled = (width / step) * (height / step);
    const fgRatio = foregroundPixelCount / totalSampled;

    // If foreground object is distinct and occupies 15% to 92% of the frame
    if (fgRatio >= 0.15 && fgRatio <= 0.95 && maxX > minX + 80 && maxY > minY + 80) {
      // Add a 6% safety margin around the detected crop
      const padX = Math.round((maxX - minX) * 0.06);
      const padY = Math.round((maxY - minY) * 0.06);

      const cropX = Math.max(0, minX - padX);
      const cropY = Math.max(0, minY - padY);
      const cropW = Math.min(width - cropX, maxX - minX + padX * 2);
      const cropH = Math.min(height - cropY, maxY - minY + padY * 2);

      return { x: cropX, y: cropY, width: cropW, height: cropH };
    }
  } catch {
    // Return null on any error to fall back to entire frame
  }
  return null;
}

/**
 * Pre-processes an image for OCR: handles rotation, optional auto-crop,
 * contrast enhancement, foil anti-glare, and unsharp sharpening convolution.
 */
export function processImageForOCR(
  sourceDataUrl: string,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING
): Promise<{
  enhancedDataUrl: string;
  sharpnessScore: number;
  detectedCrop?: { x: number; y: number; width: number; height: number };
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 1. Initial Canvas with Rotation handling
      const rot = (options.rotation || 0) % 360;
      const is90or270 = rot === 90 || rot === 270;

      let baseW = is90or270 ? img.height : img.width;
      let baseH = is90or270 ? img.width : img.height;

      const maxDim = options.maxDim || 1600;
      if (baseW > maxDim || baseH > maxDim) {
        if (baseW > baseH) {
          baseH = Math.round((baseH * maxDim) / baseW);
          baseW = maxDim;
        } else {
          baseW = Math.round((baseW * maxDim) / baseH);
          baseH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = baseW;
      canvas.height = baseH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        resolve({ enhancedDataUrl: sourceDataUrl, sharpnessScore: 80 });
        return;
      }

      ctx.save();
      // Apply rotation if requested
      if (rot !== 0) {
        ctx.translate(baseW / 2, baseH / 2);
        ctx.rotate((rot * Math.PI) / 180);
        const drawW = is90or270 ? baseH : baseW;
        const drawH = is90or270 ? baseW : baseH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.drawImage(img, 0, 0, baseW, baseH);
      }
      ctx.restore();

      // 2. Strip detection and optional auto-crop
      let cropInfo = detectStripBoundingBox(ctx, baseW, baseH);
      let renderCanvas = canvas;
      let renderCtx = ctx;
      let finalW = baseW;
      let finalH = baseH;

      if (options.autoCrop && cropInfo) {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropInfo.width;
        cropCanvas.height = cropInfo.height;
        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
        if (cropCtx) {
          cropCtx.drawImage(
            canvas,
            cropInfo.x,
            cropInfo.y,
            cropInfo.width,
            cropInfo.height,
            0,
            0,
            cropInfo.width,
            cropInfo.height
          );
          renderCanvas = cropCanvas;
          renderCtx = cropCtx;
          finalW = cropInfo.width;
          finalH = cropInfo.height;
        }
      }

      const sharpness = calculateSharpness(renderCtx, finalW, finalH);

      // 3. Pixel level enhancement: Contrast, Brightness & Foil Anti-Glare
      const imgData = renderCtx.getImageData(0, 0, finalW, finalH);
      const data = imgData.data;

      const contrastFactor = options.contrast / 100;
      const brightnessShift = options.brightness || 0;
      const antiGlare = options.antiGlare;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Anti-Glare Highlight Suppression for Foil Reflections
        if (antiGlare) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 220) {
            const compression = (lum - 220) * 0.48;
            r = Math.max(0, r - compression);
            g = Math.max(0, g - compression);
            b = Math.max(0, b - compression);
          }
        }

        // Contrast Adjustment
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255 + brightnessShift;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255 + brightnessShift;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255 + brightnessShift;

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      renderCtx.putImageData(imgData, 0, 0);

      // 4. Sharpening Unsharp Convolution Kernel (for dot-matrix stamps & small text)
      if (options.sharpen > 0) {
        const sharpenCanvas = document.createElement('canvas');
        sharpenCanvas.width = finalW;
        sharpenCanvas.height = finalH;
        const sCtx = sharpenCanvas.getContext('2d');

        if (sCtx) {
          const sFactor = options.sharpen === 1 ? 0.38 : 0.72;
          const srcData = renderCtx.getImageData(0, 0, finalW, finalH);
          const dstData = sCtx.createImageData(finalW, finalH);
          const s = srcData.data;
          const d = dstData.data;

          for (let i = 3; i < d.length; i += 4) {
            d[i] = 255;
          }

          const w4 = finalW * 4;
          const centerWeight = 1 + 4 * sFactor;
          const neighborWeight = -sFactor;

          for (let y = 1; y < finalH - 1; y++) {
            const rowOffset = y * w4;
            const prevRowOffset = (y - 1) * w4;
            const nextRowOffset = (y + 1) * w4;

            for (let x = 1; x < finalW - 1; x++) {
              const px = rowOffset + x * 4;
              const pxLeft = rowOffset + (x - 1) * 4;
              const pxRight = rowOffset + (x + 1) * 4;
              const pxUp = prevRowOffset + x * 4;
              const pxDown = nextRowOffset + x * 4;

              const rVal = s[px] * centerWeight +
                (s[pxLeft] + s[pxRight] + s[pxUp] + s[pxDown]) * neighborWeight;
              d[px] = rVal < 0 ? 0 : rVal > 255 ? 255 : rVal;

              const gVal = s[px + 1] * centerWeight +
                (s[pxLeft + 1] + s[pxRight + 1] + s[pxUp + 1] + s[pxDown + 1]) * neighborWeight;
              d[px + 1] = gVal < 0 ? 0 : gVal > 255 ? 255 : gVal;

              const bVal = s[px + 2] * centerWeight +
                (s[pxLeft + 2] + s[pxRight + 2] + s[pxUp + 2] + s[pxDown + 2]) * neighborWeight;
              d[px + 2] = bVal < 0 ? 0 : bVal > 255 ? 255 : bVal;
            }
          }

          sCtx.putImageData(dstData, 0, 0);
          renderCtx.drawImage(sharpenCanvas, 0, 0);
        }
      }

      const enhancedDataUrl = renderCanvas.toDataURL('image/jpeg', 0.92);
      resolve({
        enhancedDataUrl,
        sharpnessScore: sharpness,
        detectedCrop: cropInfo || undefined
      });
    };

    img.onerror = () => {
      resolve({ enhancedDataUrl: sourceDataUrl, sharpnessScore: 70 });
    };

    img.src = sourceDataUrl;
  });
}

export interface PackagingRegion {
  id: 'full' | 'top_crimp' | 'bottom_crimp' | 'left_margin' | 'right_margin' | 'center_body';
  name: string;
  description: string;
  dataUrl: string;
  width: number;
  height: number;
  sharpnessScore: number;
  rotated?: boolean;
}

/**
 * Applies contrast, anti-glare, and sharpening convolution to a canvas.
 */
function enhanceSubCanvas(
  canvas: HTMLCanvasElement,
  contrast: number = 145,
  sharpenFactor: number = 0.5,
  antiGlare: boolean = true
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.92);

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const factor = contrast / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (antiGlare) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 220) {
        const comp = (lum - 220) * 0.45;
        r = Math.max(0, r - comp);
        g = Math.max(0, g - comp);
        b = Math.max(0, b - comp);
      }
    }

    r = ((r / 255 - 0.5) * factor + 0.5) * 255;
    g = ((g / 255 - 0.5) * factor + 0.5) * 255;
    b = ((b / 255 - 0.5) * factor + 0.5) * 255;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // Unsharp sharpening
  if (sharpenFactor > 0 && width > 4 && height > 4) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = width;
    sCanvas.height = height;
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      const src = ctx.getImageData(0, 0, width, height);
      const dst = sCtx.createImageData(width, height);
      const s = src.data;
      const d = dst.data;
      for (let i = 3; i < d.length; i += 4) d[i] = 255;

      const w4 = width * 4;
      const centerW = 1 + 4 * sharpenFactor;
      const neighborW = -sharpenFactor;

      for (let y = 1; y < height - 1; y++) {
        const row = y * w4;
        const prevRow = (y - 1) * w4;
        const nextRow = (y + 1) * w4;

        for (let x = 1; x < width - 1; x++) {
          const px = row + x * 4;
          const pxL = row + (x - 1) * 4;
          const pxR = row + (x + 1) * 4;
          const pxU = prevRow + x * 4;
          const pxD = nextRow + x * 4;

          d[px] = Math.min(255, Math.max(0, s[px] * centerW + (s[pxL] + s[pxR] + s[pxU] + s[pxD]) * neighborW));
          d[px + 1] = Math.min(255, Math.max(0, s[px + 1] * centerW + (s[pxL + 1] + s[pxR + 1] + s[pxU + 1] + s[pxD + 1]) * neighborW));
          d[px + 2] = Math.min(255, Math.max(0, s[px + 2] * centerW + (s[pxL + 2] + s[pxR + 2] + s[pxU + 2] + s[pxD + 2]) * neighborW));
        }
      }
      sCtx.putImageData(dst, 0, 0);
      ctx.drawImage(sCanvas, 0, 0);
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Slices the medicine strip image into targeted high-resolution regions:
 * 1. Top crimp edge (where EXP / MFG / B.No are commonly stamped in foil)
 * 2. Bottom crimp edge (where MRP / B.No are frequently printed)
 * 3. Left margin (rotated 90° for vertical edge stamps)
 * 4. Right margin (rotated 90° for vertical edge stamps)
 * 5. Center formulation zone (for brand, salt composition, manufacturer)
 */
export function extractPackagingRegions(sourceDataUrl: string): Promise<PackagingRegion[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const regions: PackagingRegion[] = [];

      // 1. Full view
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = Math.min(1600, w);
      fullCanvas.height = Math.round((fullCanvas.width * h) / w);
      const fullCtx = fullCanvas.getContext('2d');
      if (fullCtx) {
        fullCtx.drawImage(img, 0, 0, fullCanvas.width, fullCanvas.height);
        const fullScore = calculateSharpness(fullCtx, fullCanvas.width, fullCanvas.height);
        regions.push({
          id: 'full',
          name: 'Full Strip Overview',
          description: 'Complete packaging layout and commercial typography',
          dataUrl: enhanceSubCanvas(fullCanvas, 130, 0.35, true),
          width: fullCanvas.width,
          height: fullCanvas.height,
          sharpnessScore: fullScore
        });
      }

      // 2. Top Crimp Zone (top ~30% height, upscaled & high-contrast for dot-matrix stamps)
      const topH = Math.max(80, Math.floor(h * 0.30));
      const topCanvas = document.createElement('canvas');
      // upscale width/height if small to ensure dot-matrix text is legible
      const topScale = Math.min(2.5, Math.max(1.2, 1200 / w));
      topCanvas.width = Math.round(w * topScale);
      topCanvas.height = Math.round(topH * topScale);
      const topCtx = topCanvas.getContext('2d');
      if (topCtx) {
        topCtx.imageSmoothingEnabled = true;
        topCtx.imageSmoothingQuality = 'high';
        topCtx.drawImage(img, 0, 0, w, topH, 0, 0, topCanvas.width, topCanvas.height);
        const topScore = calculateSharpness(topCtx, topCanvas.width, topCanvas.height);
        regions.push({
          id: 'top_crimp',
          name: 'Top Crimp Zone',
          description: 'Sealed foil flap magnified for stamped MFG/EXP dates and Batch No.',
          dataUrl: enhanceSubCanvas(topCanvas, 155, 0.65, true),
          width: topCanvas.width,
          height: topCanvas.height,
          sharpnessScore: topScore
        });
      }

      // 3. Bottom Crimp Zone (bottom ~30% height, upscaled & high-contrast)
      const botH = Math.max(80, Math.floor(h * 0.30));
      const botY = Math.max(0, h - botH);
      const botCanvas = document.createElement('canvas');
      const botScale = Math.min(2.5, Math.max(1.2, 1200 / w));
      botCanvas.width = Math.round(w * botScale);
      botCanvas.height = Math.round(botH * botScale);
      const botCtx = botCanvas.getContext('2d');
      if (botCtx) {
        botCtx.imageSmoothingEnabled = true;
        botCtx.imageSmoothingQuality = 'high';
        botCtx.drawImage(img, 0, botY, w, botH, 0, 0, botCanvas.width, botCanvas.height);
        const botScore = calculateSharpness(botCtx, botCanvas.width, botCanvas.height);
        regions.push({
          id: 'bottom_crimp',
          name: 'Bottom Crimp Zone',
          description: 'Lower packaging margin magnified for MRP, Batch Lot, and Expiry',
          dataUrl: enhanceSubCanvas(botCanvas, 155, 0.65, true),
          width: botCanvas.width,
          height: botCanvas.height,
          sharpnessScore: botScore
        });
      }

      // 4. Left Margin (left ~28% width, rotated 90° clockwise so vertical stamps become horizontal)
      const leftW = Math.max(80, Math.floor(w * 0.28));
      const leftCanvas = document.createElement('canvas');
      // After 90° rotation, canvas width is height, canvas height is width
      const rotScale = Math.min(2.5, Math.max(1.2, 1200 / h));
      const destW = Math.round(h * rotScale);
      const destH = Math.round(leftW * rotScale);
      leftCanvas.width = destW;
      leftCanvas.height = destH;
      const leftCtx = leftCanvas.getContext('2d');
      if (leftCtx) {
        leftCtx.save();
        leftCtx.translate(destW / 2, destH / 2);
        leftCtx.rotate((90 * Math.PI) / 180);
        leftCtx.drawImage(
          img,
          0,
          0,
          leftW,
          h,
          -destH / 2,
          -destW / 2,
          destH,
          destW
        );
        leftCtx.restore();
        const leftScore = calculateSharpness(leftCtx, destW, destH);
        regions.push({
          id: 'left_margin',
          name: 'Left Edge Margin (Rotated 90°)',
          description: 'Vertical edge rotated horizontally to read side-stamped batch/date',
          dataUrl: enhanceSubCanvas(leftCanvas, 160, 0.65, true),
          width: destW,
          height: destH,
          sharpnessScore: leftScore,
          rotated: true
        });
      }

      // 5. Right Margin (right ~28% width, rotated 90° clockwise)
      const rightW = Math.max(80, Math.floor(w * 0.28));
      const rightX = Math.max(0, w - rightW);
      const rightCanvas = document.createElement('canvas');
      const rDestW = Math.round(h * rotScale);
      const rDestH = Math.round(rightW * rotScale);
      rightCanvas.width = rDestW;
      rightCanvas.height = rDestH;
      const rightCtx = rightCanvas.getContext('2d');
      if (rightCtx) {
        rightCtx.save();
        rightCtx.translate(rDestW / 2, rDestH / 2);
        rightCtx.rotate((90 * Math.PI) / 180);
        rightCtx.drawImage(
          img,
          rightX,
          0,
          rightW,
          h,
          -rDestH / 2,
          -rDestW / 2,
          rDestH,
          rDestW
        );
        rightCtx.restore();
        const rightScore = calculateSharpness(rightCtx, rDestW, rDestH);
        regions.push({
          id: 'right_margin',
          name: 'Right Edge Margin (Rotated 90°)',
          description: 'Opposite vertical border rotated horizontally to read edge markings',
          dataUrl: enhanceSubCanvas(rightCanvas, 160, 0.65, true),
          width: rDestW,
          height: rDestH,
          sharpnessScore: rightScore,
          rotated: true
        });
      }

      // 6. Center Formulation Zone (active ingredients, composition, warnings)
      const cX = Math.floor(w * 0.15);
      const cY = Math.floor(h * 0.20);
      const cW = Math.floor(w * 0.70);
      const cH = Math.floor(h * 0.60);
      const centerCanvas = document.createElement('canvas');
      centerCanvas.width = Math.min(1400, cW);
      centerCanvas.height = Math.round((centerCanvas.width * cH) / cW);
      const centerCtx = centerCanvas.getContext('2d');
      if (centerCtx) {
        centerCtx.drawImage(img, cX, cY, cW, cH, 0, 0, centerCanvas.width, centerCanvas.height);
        const centerScore = calculateSharpness(centerCtx, centerCanvas.width, centerCanvas.height);
        regions.push({
          id: 'center_body',
          name: 'Center Formulation Body',
          description: 'Focused view on salt composition, pharmacopeia standards, and manufacturer',
          dataUrl: enhanceSubCanvas(centerCanvas, 135, 0.40, true),
          width: centerCanvas.width,
          height: centerCanvas.height,
          sharpnessScore: centerScore
        });
      }

      resolve(regions);
    };

    img.onerror = () => {
      resolve([]);
    };

    img.src = sourceDataUrl;
  });
}
