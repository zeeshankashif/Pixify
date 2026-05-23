/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface AdjustmentParams {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  clarity: number;
  dehaze: number;
  vignette: number;
  sharpen: number;
  // Advanced Lightroom Controls
  texture: number;
  grain: number;
  noiseReduction: number;
  splitToningHighlightsHue: number;
  splitToningHighlightsSat: number;
  splitToningShadowsHue: number;
  splitToningShadowsSat: number;
  curveHighlights: number;
  curveLights: number;
  curveDarks: number;
  curveShadows: number;
  hue: Record<string, number>;
  sat: Record<string, number>;
  lum: Record<string, number>;
}

export const defaultAdjustments: AdjustmentParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  sharpen: 0,
  // Advanced defaults
  texture: 0,
  grain: 0,
  noiseReduction: 0,
  splitToningHighlightsHue: 0,
  splitToningHighlightsSat: 0,
  splitToningShadowsHue: 0,
  splitToningShadowsSat: 0,
  curveHighlights: 0,
  curveLights: 0,
  curveDarks: 0,
  curveShadows: 0,
  hue: { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, purple: 0, magenta: 0 },
  sat: { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, purple: 0, magenta: 0 },
  lum: { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, purple: 0, magenta: 0 },
};

// Conversions for RGB <-> HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function applySharpenConvolution(imageData: ImageData, k: number) {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const centerIdx = (y * w + x) * 4;
      const upIdx = ((y - 1) * w + x) * 4;
      const downIdx = ((y + 1) * w + x) * 4;
      const leftIdx = (y * w + (x - 1)) * 4;
      const rightIdx = (y * w + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val = src[centerIdx + c] * (1 + 4 * k)
                  - src[upIdx + c] * k
                  - src[downIdx + c] * k
                  - src[leftIdx + c] * k
                  - src[rightIdx + c] * k;
        dst[centerIdx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
}

function applyNoiseReduction(imageData: ImageData, amount: number) {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const blend = (amount / 100) * 0.6; // Max 60% blur blend to maintain key edges

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      
      // Compute fast local average
      let sumR = 0, sumG = 0, sumB = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nIdx = ((y + ky) * w + (x + kx)) * 4;
          sumR += src[nIdx];
          sumG += src[nIdx + 1];
          sumB += src[nIdx + 2];
        }
      }
      
      const avgR = sumR / 9;
      const avgG = sumG / 9;
      const avgB = sumB / 9;

      dst[idx] = Math.max(0, Math.min(255, src[idx] * (1 - blend) + avgR * blend));
      dst[idx + 1] = Math.max(0, Math.min(255, src[idx + 1] * (1 - blend) + avgG * blend));
      dst[idx + 2] = Math.max(0, Math.min(255, src[idx + 2] * (1 - blend) + avgB * blend));
    }
  }
}

export function applyLightroomFilters(
  srcData: ImageData,
  destData: ImageData,
  params: AdjustmentParams
) {
  const src = srcData.data;
  const dst = destData.data;
  const len = src.length;
  const width = srcData.width;
  const height = srcData.height;

  // Precompute constants for optimizations
  const exposureMult = Math.pow(1.5, params.exposure / 25);
  const contrastFactor = (259 * (params.contrast + 255)) / (255 * (259 - params.contrast));
  const highlightsVal = params.highlights / 100;
  const shadowsVal = params.shadows / 100;
  const whitesVal = params.whites / 100;
  const blacksVal = params.blacks / 100;
  
  const tempVal = params.temperature / 100;
  const tintVal = params.tint / 100;
  const vibranceVal = params.vibrance / 100;
  const saturationMult = 1 + params.saturation / 100;
  
  const vignetteVal = params.vignette / 100;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistSq = centerX * centerX + centerY * centerY || 1;

  const dehazeVal = params.dehaze / 100;

  // Grain lookup table to prevent expensive Math.random calls in high resolution loops
  const grainVal = params.grain;
  const noiseTable = grainVal > 0 ? new Float32Array(4096) : null;
  if (noiseTable) {
    for (let k = 0; k < 4096; k++) {
      noiseTable[k] = (Math.random() - 0.5) * (grainVal / 100) * 38;
    }
  }

  // Quick check for HSL adjustments to bypass if not needed
  let hasHslAdjust = false;
  for (const k in params.hue) {
    if (params.hue[k] !== 0 || params.sat[k] !== 0 || params.lum[k] !== 0) {
      hasHslAdjust = true;
      break;
    }
  }
  const hasSplitToning = (params.splitToningHighlightsSat > 0 || params.splitToningShadowsSat > 0);

  // Pre-define interpolation bands for HSL Color mixer
  const bands = [
    { id: 'red', h: 0 },
    { id: 'orange', h: 30 },
    { id: 'yellow', h: 60 },
    { id: 'green', h: 120 },
    { id: 'cyan', h: 180 },
    { id: 'blue', h: 240 },
    { id: 'purple', h: 280 },
    { id: 'magenta', h: 320 },
    { id: 'red2', h: 360 } // Red wrap-around
  ];

  for (let i = 0; i < len; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];
    const a = src[i + 3];

    // --- 1. LIGHT ADJUSTMENTS ---
    // Exposure
    if (params.exposure !== 0) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // Contrast
    if (params.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Compute original luminance for highlights/shadows
    let luma = 0.299 * r + 0.587 * g + 0.114 * b;

    // Highlights
    if (params.highlights !== 0) {
      const wHighlight = Math.max(0, (luma - 100) / 155);
      const highFactor = 1 + highlightsVal * wHighlight * 0.45;
      r *= highFactor;
      g *= highFactor;
      b *= highFactor;
    }

    // Shadows
    if (params.shadows !== 0) {
      const wShadow = Math.max(0, (155 - luma) / 155);
      const shadowFactor = 1 + shadowsVal * wShadow * 0.4;
      r *= shadowFactor;
      g *= shadowFactor;
      b *= shadowFactor;
    }

    // Whites
    if (params.whites !== 0) {
      const wWhite = Math.max(0, r / 255);
      r += whitesVal * wWhite * 30;
      g += whitesVal * (g / 255) * 30;
      b += whitesVal * (b / 255) * 30;
    }

    // Blacks
    if (params.blacks !== 0) {
      const wBlack = Math.max(0, 1 - r / 255);
      r += blacksVal * wBlack * 25;
      g += blacksVal * (1 - g / 255) * 25;
      b += blacksVal * (1 - b / 255) * 25;
    }

    // --- 1.1 TONE CURVE PARAMETRIC ADJUSTMENTS ---
    if (params.curveHighlights !== 0 || params.curveLights !== 0 || params.curveDarks !== 0 || params.curveShadows !== 0) {
      const zoneLuma = 0.299 * r + 0.587 * g + 0.114 * b;
      let curveOffset = 0;
      
      // Highlights Curving (top 30%)
      if (zoneLuma > 170) {
        const w = (zoneLuma - 170) / 85; 
        curveOffset += (params.curveHighlights / 120) * w * w * 32;
      }
      // Lights Curving (peaks at around 155)
      if (zoneLuma > 90 && zoneLuma < 210) {
        const w = 1 - Math.abs(zoneLuma - 155) / 65;
        curveOffset += (params.curveLights / 120) * w * 26;
      }
      // Darks Curving (peaks at around 105)
      if (zoneLuma > 45 && zoneLuma < 165) {
        const w = 1 - Math.abs(zoneLuma - 105) / 60;
        curveOffset += (params.curveDarks / 120) * w * 26;
      }
      // Shadows Curving (bottom 30%)
      if (zoneLuma < 85) {
        const w = (85 - zoneLuma) / 85;
        curveOffset += (params.curveShadows / 120) * w * w * 28;
      }
      r += curveOffset;
      g += curveOffset;
      b += curveOffset;
    }

    // Dehaze
    if (params.dehaze !== 0) {
      const distanceToGray = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      if (distanceToGray < 120) {
        r = r + dehazeVal * (r - 128) * 0.25;
        g = g + dehazeVal * (g - 128) * 0.25;
        b = b + dehazeVal * (b - 128) * 0.25;
      }
    }

    // --- 2. COLOR ADJUSTMENTS ---
    // Temperature (Temp)
    if (params.temperature !== 0) {
      r += tempVal * 25;
      b -= tempVal * 25;
    }

    // Tint
    if (params.tint !== 0) {
      r += tintVal * 12;
      b += tintVal * 12;
      g -= tintVal * 20;
    }

    // Vibrance (Saturate low-saturated areas first)
    if (params.vibrance !== 0) {
      luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const currentSat = max === 0 ? 0 : (max - min) / max;
      const vFactor = vibranceVal * (1 - currentSat) * 0.85;
      r = luma + (r - luma) * (1 + vFactor);
      g = luma + (g - luma) * (1 + vFactor);
      b = luma + (b - luma) * (1 + vFactor);
    }

    // Saturation
    if (params.saturation !== 0) {
      luma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = luma + (r - luma) * saturationMult;
      g = luma + (g - luma) * saturationMult;
      b = luma + (b - luma) * saturationMult;
    }

    // Core clamping before HSL conversion for safety
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // --- 3. HSL COLOR CHANNEL TUNNING & SPLIT TONING COLOR GRADING ---
    if (hasHslAdjust || hasSplitToning) {
      const [h, s, l] = rgbToHsl(r, g, b);

      let newH = h;
      let newS = s;
      let newL = l;

      if (hasHslAdjust) {
        let n1 = bands[0];
        let n2 = bands[1];
        for (let bIdx = 0; bIdx < bands.length - 1; bIdx++) {
          if (h >= bands[bIdx].h && h <= bands[bIdx + 1].h) {
            n1 = bands[bIdx];
            n2 = bands[bIdx + 1];
            break;
          }
        }

        const id1 = n1.id === 'red2' ? 'red' : n1.id;
        const id2 = n2.id === 'red2' ? 'red' : n2.id;

        const span = n2.h - n1.h;
        const w2 = span === 0 ? 0 : (h - n1.h) / span;
        const w1 = 1 - w2;

        // Weighted interpolation of HSL values
        const hueShift = w1 * params.hue[id1] + w2 * params.hue[id2];
        const satScale = w1 * params.sat[id1] + w2 * params.sat[id2];
        const lumScale = w1 * params.lum[id1] + w2 * params.lum[id2];

        if (hueShift !== 0) {
          newH = (h + hueShift * 0.25) % 360;
          if (newH < 0) newH += 360;
        }

        if (satScale !== 0) {
          newS = s * (1 + satScale / 100);
          newS = Math.max(0, Math.min(1, newS));
        }

        if (lumScale !== 0) {
          // Elite sine curve to preserve blacks (0) and whites (1)
          newL = l + (lumScale / 100) * 0.22 * Math.sin(Math.PI * l);
          newL = Math.max(0, Math.min(1, newL));
        }
      }

      // Adobe Split Toning Color Grading 
      if (hasSplitToning) {
        const wHigh = Math.min(1, Math.max(0, (newL - 0.45) / 0.55)); // Highlights (peaks at 1.0)
        const wShadow = Math.min(1, Math.max(0, (0.55 - newL) / 0.55)); // Shadows (peaks at 0.0)

        // Highlight Grading
        if (wHigh > 0 && params.splitToningHighlightsSat > 0) {
          const hiHue = params.splitToningHighlightsHue;
          const hiSat = params.splitToningHighlightsSat / 100;
          const blendRate = wHigh * hiSat * 0.4;
          newS = newS * (1 - blendRate) + hiSat * blendRate;
          newS = Math.max(0, Math.min(1, newS));
          
          let diff = hiHue - newH;
          if (diff > 180) diff -= 360;
          else if (diff < -180) diff += 360;
          newH = (newH + diff * blendRate) % 360;
          if (newH < 0) newH += 360;
        }

        // Shadow Grading
        if (wShadow > 0 && params.splitToningShadowsSat > 0) {
          const shHue = params.splitToningShadowsHue;
          const shSat = params.splitToningShadowsSat / 100;
          const blendRate = wShadow * shSat * 0.4;
          newS = newS * (1 - blendRate) + shSat * blendRate;
          newS = Math.max(0, Math.min(1, newS));

          let diff = shHue - newH;
          if (diff > 180) diff -= 360;
          else if (diff < -180) diff += 360;
          newH = (newH + diff * blendRate) % 360;
          if (newH < 0) newH += 360;
        }
      }

      const [adjR, adjG, adjB] = hslToRgb(newH, newS, newL);
      r = adjR;
      g = adjG;
      b = adjB;
    }

    // --- 4. EFFECTS: VIGNETTE ---
    if (params.vignette !== 0) {
      const idx = i / 4;
      const px = idx % width;
      const py = Math.floor(idx / width);
      const dx = px - centerX;
      const dy = py - centerY;
      const distSq = (dx * dx + dy * dy) / maxDistSq;

      let vigFactor = 1;
      if (vignetteVal < 0) {
        vigFactor = 1 + vignetteVal * 0.65 * distSq;
      } else {
        vigFactor = 1 + vignetteVal * 0.35 * distSq;
      }
      r *= vigFactor;
      g *= vigFactor;
      b *= vigFactor;
    }

    // --- 4.1 EFFECTS: ANALOG FILM GRAIN ---
    if (noiseTable) {
      const gNoise = noiseTable[((i / 4) | 0) % 4096];
      r += gNoise;
      g += gNoise;
      b += gNoise;
    }

    dst[i] = Math.max(0, Math.min(255, r));
    dst[i + 1] = Math.max(0, Math.min(255, g));
    dst[i + 2] = Math.max(0, Math.min(255, b));
    dst[i + 3] = a;
  }

  // --- 5. EFFECTS: SHARPEN / CLARITY / TEXTURE CONVOLUTION ---
  const kSharpen = (params.sharpen / 100) * 0.45 + (params.clarity / 100) * 0.18 + (params.texture / 100) * 0.28;
  if (kSharpen > 0) {
    applySharpenConvolution(destData, kSharpen);
  }

  // --- 6. EFFECTS: NOISE REDUCTION PASS ---
  if (params.noiseReduction > 0) {
    applyNoiseReduction(destData, params.noiseReduction);
  }
}

// Compute histogram bins (Red, Green, Blue, Lum) for live graphing
export interface HistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  lum: Uint32Array;
  maxCount: number;
}

export function computeHistogram(imageData: ImageData): HistogramData {
  const data = imageData.data;
  const len = data.length;
  
  const rBins = new Uint32Array(256);
  const gBins = new Uint32Array(256);
  const bBins = new Uint32Array(256);
  const lumBins = new Uint32Array(256);

  // Fast voxel sub-sampling (step by 8 for 60fps real-time updates)
  const step = len > 800000 ? 8 : 4; 

  for (let i = 0; i < len; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    rBins[r]++;
    gBins[g]++;
    bBins[b]++;
    lumBins[lum]++;
  }

  // Find max peak (excluding clipping edges for look-safety)
  let maxCount = 1;
  for (let i = 2; i < 254; i++) {
    if (rBins[i] > maxCount) maxCount = rBins[i];
    if (gBins[i] > maxCount) maxCount = gBins[i];
    if (bBins[i] > maxCount) maxCount = bBins[i];
    if (lumBins[i] > maxCount) maxCount = lumBins[i];
  }

  return { r: rBins, g: gBins, b: bBins, lum: lumBins, maxCount };
}
