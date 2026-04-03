import sharp from "sharp";

export interface BgOption {
  name: string;
  label: string;
  color: { r: number; g: number; b: number };
}

export const BG_OPTIONS: BgOption[] = [
  { name: "white", label: "White (Amazon)", color: { r: 255, g: 255, b: 255 } },
  { name: "light-gray", label: "Light Gray", color: { r: 245, g: 245, b: 245 } },
  { name: "warm", label: "Warm Cream", color: { r: 250, g: 245, b: 238 } },
  { name: "cool-gray", label: "Cool Gray", color: { r: 235, g: 238, b: 242 } },
  { name: "dark", label: "Dark", color: { r: 30, g: 30, b: 35 } },
];

// Gradient background templates
export interface GradientBg {
  name: string;
  label: string;
  from: { r: number; g: number; b: number };
  to: { r: number; g: number; b: number };
}

export const GRADIENT_OPTIONS: GradientBg[] = [
  { name: "sunset", label: "Sunset", from: { r: 255, g: 200, b: 150 }, to: { r: 255, g: 150, b: 100 } },
  { name: "ocean", label: "Ocean", from: { r: 200, g: 230, b: 255 }, to: { r: 150, g: 200, b: 240 } },
  { name: "mint", label: "Mint", from: { r: 220, g: 255, b: 240 }, to: { r: 180, g: 240, b: 220 } },
  { name: "lavender", label: "Lavender", from: { r: 240, g: 220, b: 255 }, to: { r: 220, g: 200, b: 250 } },
  { name: "peach", label: "Peach", from: { r: 255, g: 230, b: 220 }, to: { r: 255, g: 210, b: 200 } },
];

export async function createGradientBg(
  size: number,
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
): Promise<Buffer> {
  // Create vertical gradient using SVG
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(${from.r},${from.g},${from.b})" />
        <stop offset="100%" style="stop-color:rgb(${to.r},${to.g},${to.b})" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)" />
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

export async function compositeProductOnGradient(
  productPng: Buffer,
  gradient: GradientBg,
  options?: CompositeOptions,
): Promise<Buffer> {
  const opts = options || {};
  const size = opts.size || 2048;
  const padding = Math.max(0.6, Math.min(0.95, opts.padding || 0.8));
  const enhance = opts.enhance || false;

  const cleanedPng = await cleanAlphaEdges(productPng);
  const trimmed = await sharp(cleanedPng).trim().toBuffer();
  const trimMeta = await sharp(trimmed).metadata();
  const tw = trimMeta.width || 100;
  const th = trimMeta.height || 100;

  const maxDim = Math.floor(size * padding);
  const scale = Math.min(maxDim / tw, maxDim / th);
  const finalW = Math.floor(tw * scale);
  const finalH = Math.floor(th * scale);

  let resized = await sharp(trimmed).resize(finalW, finalH, { fit: "fill" }).toBuffer();

  if (enhance) {
    resized = await sharp(resized)
      .sharpen({ sigma: 1.2 })
      .modulate({ brightness: 1.02, saturation: 1.05 })
      .toBuffer();
  }

  const productLeft = Math.floor((size - finalW) / 2);
  const productTop = Math.floor((size - finalH) / 2);

  const gradientBg = await createGradientBg(size, gradient.from, gradient.to);

  return sharp(gradientBg)
    .composite([{ input: resized, top: productTop, left: productLeft }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export function validateHexColor(input: string): { r: number; g: number; b: number } | null {
  const match = input.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const hex = match[1];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

export interface CompositeOptions {
  size?: number;        // Output size in px (default 2048)
  padding?: number;     // Product fill ratio 0.6~0.95 (default 0.8)
  shadow?: boolean;     // Add contact shadow (default false)
  enhance?: boolean;    // AI enhance/sharpen (default false)
}

// Marketplace presets
export const MARKETPLACE_PRESETS: Record<string, { size: number; label: string }> = {
  amazon: { size: 2000, label: "Amazon (2000×2000)" },
  etsy: { size: 2000, label: "Etsy (2000×2000)" },
  shopify: { size: 2048, label: "Shopify (2048×2048)" },
  ebay: { size: 1600, label: "eBay (1600×1600)" },
  instagram: { size: 1080, label: "Instagram (1080×1080)" },
  default: { size: 2048, label: "Default (2048×2048)" },
};

// Clean up semi-transparent edge artifacts from AI background removal
// Decontaminates RGB channels in semi-transparent pixels to remove
// residual background color bleeding (common with glass/transparent objects)
async function cleanAlphaEdges(productPng: Buffer): Promise<Buffer> {
  const raw = await sharp(productPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const data = raw.data;

  // Pass 1: Estimate the background color from near-transparent edge pixels (alpha 1-30)
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a > 0 && a < 30) {
      bgR += data[i - 3];
      bgG += data[i - 2];
      bgB += data[i - 1];
      bgCount++;
    }
  }
  // Fallback to white if not enough edge samples
  const estBgR = bgCount > 50 ? bgR / bgCount : 220;
  const estBgG = bgCount > 50 ? bgG / bgCount : 220;
  const estBgB = bgCount > 50 ? bgB / bgCount : 220;

  // Pass 2: Decontaminate
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a < 10) {
      // Fully transparent — zero out
      data[i - 3] = 0;
      data[i - 2] = 0;
      data[i - 1] = 0;
      data[i] = 0;
    } else if (a < 240) {
      // Semi-transparent — remove estimated background color contribution
      // Using un-premultiply: fg = (pixel - bg * (1-alpha)) / alpha
      const af = a / 255;
      const bgFactor = 1 - af;
      const r = Math.max(0, Math.min(255, Math.round((data[i - 3] - estBgR * bgFactor) / af)));
      const g = Math.max(0, Math.min(255, Math.round((data[i - 2] - estBgG * bgFactor) / af)));
      const b = Math.max(0, Math.min(255, Math.round((data[i - 1] - estBgB * bgFactor) / af)));
      data[i - 3] = r;
      data[i - 2] = g;
      data[i - 1] = b;
    }
    // alpha >= 240: fully opaque, leave as-is
  }

  return sharp(data, {
    raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
  }).png().toBuffer();
}

export async function compositeProductOnBg(
  productPng: Buffer,
  bgColor: { r: number; g: number; b: number },
  sizeOrOptions?: number | CompositeOptions
): Promise<Buffer> {
  const opts: CompositeOptions = typeof sizeOrOptions === "number"
    ? { size: sizeOrOptions }
    : sizeOrOptions || {};

  const size = opts.size || 2048;
  const padding = Math.max(0.6, Math.min(0.95, opts.padding || 0.8));
  const shadow = opts.shadow || false;
  const enhance = opts.enhance || false;

  // 1. Clean up semi-transparent edge artifacts, then trim
  const cleanedPng = await cleanAlphaEdges(productPng);
  const trimmed = await sharp(cleanedPng).trim().toBuffer();
  const trimMeta = await sharp(trimmed).metadata();
  const tw = trimMeta.width || 100;
  const th = trimMeta.height || 100;

  // 2. Fit into canvas with padding
  const maxDim = Math.floor(size * padding);
  const scale = Math.min(maxDim / tw, maxDim / th);
  const finalW = Math.floor(tw * scale);
  const finalH = Math.floor(th * scale);

  let resized = await sharp(trimmed)
    .resize(finalW, finalH, { fit: "fill" })
    .toBuffer();

  // Optional: AI enhance (sharpen + contrast boost)
  if (enhance) {
    resized = await sharp(resized)
      .sharpen({ sigma: 1.2 })
      .modulate({ brightness: 1.02, saturation: 1.05 })
      .toBuffer();
  }

  // 3. Center product
  const productLeft = Math.floor((size - finalW) / 2);
  const productTop = Math.floor((size - finalH) / 2);

  // 4. Build composite layers
  const layers: sharp.OverlayOptions[] = [];

  // Optional contact shadow
  if (shadow) {
    const shadowW = Math.floor(finalW * 0.6);
    const shadowH = Math.floor(size * 0.01);
    const shadowSvgH = shadowH * 6;
    const shadowLeft = productLeft + Math.floor((finalW - shadowW) / 2);
    const shadowTop = productTop + finalH - Math.floor(shadowSvgH * 0.2);

    const shadowSvg = `<svg width="${shadowW}" height="${shadowSvgH}">
      <ellipse cx="${shadowW / 2}" cy="${shadowSvgH / 2}" rx="${shadowW / 2}" ry="${shadowH}"
        fill="rgba(0,0,0,0.1)" filter="url(#b)"/>
      <defs><filter id="b"><feGaussianBlur stdDeviation="5"/></filter></defs>
    </svg>`;
    layers.push({ input: Buffer.from(shadowSvg), top: shadowTop, left: shadowLeft });
  }

  layers.push({ input: resized, top: productTop, left: productLeft });

  return sharp({
    create: { width: size, height: size, channels: 4, background: { ...bgColor, alpha: 255 } },
  })
    .composite(layers)
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function compositeAllBackgrounds(
  productPng: Buffer,
  backgrounds?: BgOption[],
  options?: CompositeOptions
): Promise<{ name: string; label: string; buffer: Buffer }[]> {
  const bgs = backgrounds || BG_OPTIONS;
  const results: { name: string; label: string; buffer: Buffer }[] = [];

  for (const bg of bgs) {
    const buffer = await compositeProductOnBg(productPng, bg.color, options);
    results.push({ name: bg.name, label: bg.label, buffer });
  }

  return results;
}

export async function createFreePreview(
  productPng: Buffer
): Promise<Buffer> {
  const small = await compositeProductOnBg(
    productPng,
    { r: 255, g: 255, b: 255 },
    512
  );

  const svgWatermark = `
    <svg width="512" height="512">
      <style>.wm { fill: rgba(0,0,0,0.08); font-size: 42px; font-family: Arial; font-weight: bold; }</style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            class="wm" transform="rotate(-30, 256, 256)">BgSwap</text>
    </svg>
  `;

  return sharp(small)
    .composite([{ input: Buffer.from(svgWatermark), gravity: "center" }])
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Texture background templates (SVG-based, no external images needed)
export interface TextureBg {
  name: string;
  label: string;
  svg: (size: number) => string;
}

export const TEXTURE_OPTIONS: TextureBg[] = [
  {
    name: "marble",
    label: "Marble",
    svg: (size: number) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="marble">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="5" seed="2" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.3" intercept="0.7" />
            <feFuncG type="linear" slope="0.3" intercept="0.7" />
            <feFuncB type="linear" slope="0.3" intercept="0.72" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="#f0eeec" />
      <rect width="${size}" height="${size}" filter="url(#marble)" opacity="0.6" />
    </svg>`,
  },
  {
    name: "wood",
    label: "Wood",
    svg: (size: number) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="wood">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.002" numOctaves="3" seed="5" />
          <feColorMatrix type="matrix" values="0.4 0 0 0 0.55  0.3 0 0 0 0.38  0.15 0 0 0 0.22  0 0 0 1 0" />
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="#c4a882" />
      <rect width="${size}" height="${size}" filter="url(#wood)" opacity="0.7" />
    </svg>`,
  },
  {
    name: "linen",
    label: "Linen",
    svg: (size: number) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="linen">
          <feTurbulence type="turbulence" baseFrequency="0.3" numOctaves="2" seed="8" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.08" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="#f5f0e8" />
      <rect width="${size}" height="${size}" filter="url(#linen)" />
    </svg>`,
  },
  {
    name: "concrete",
    label: "Concrete",
    svg: (size: number) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="concrete">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" seed="12" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.15" intercept="0.62" />
            <feFuncG type="linear" slope="0.15" intercept="0.62" />
            <feFuncB type="linear" slope="0.15" intercept="0.64" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="#b0aca8" />
      <rect width="${size}" height="${size}" filter="url(#concrete)" opacity="0.5" />
    </svg>`,
  },
  {
    name: "paper",
    label: "Paper",
    svg: (size: number) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" seed="20" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.06" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="#faf8f5" />
      <rect width="${size}" height="${size}" filter="url(#paper)" />
    </svg>`,
  },
];

export async function createTextureBg(
  size: number,
  texture: TextureBg,
): Promise<Buffer> {
  const svg = texture.svg(size);
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

export async function compositeProductOnTexture(
  productPng: Buffer,
  texture: TextureBg,
  options?: CompositeOptions,
): Promise<Buffer> {
  const opts = options || {};
  const size = opts.size || 2048;
  const padding = Math.max(0.6, Math.min(0.95, opts.padding || 0.8));
  const enhance = opts.enhance || false;

  const cleanedPng = await cleanAlphaEdges(productPng);
  const trimmed = await sharp(cleanedPng).trim().toBuffer();
  const trimMeta = await sharp(trimmed).metadata();
  const tw = trimMeta.width || 100;
  const th = trimMeta.height || 100;

  const maxDim = Math.floor(size * padding);
  const scale = Math.min(maxDim / tw, maxDim / th);
  const finalW = Math.floor(tw * scale);
  const finalH = Math.floor(th * scale);

  let resized = await sharp(trimmed).resize(finalW, finalH, { fit: "fill" }).toBuffer();

  if (enhance) {
    resized = await sharp(resized)
      .sharpen({ sigma: 1.2 })
      .modulate({ brightness: 1.02, saturation: 1.05 })
      .toBuffer();
  }

  const productLeft = Math.floor((size - finalW) / 2);
  const productTop = Math.floor((size - finalH) / 2);

  const textureBg = await createTextureBg(size, texture);

  const layers: sharp.OverlayOptions[] = [];

  // Optional contact shadow
  if (opts.shadow) {
    const shadowW = Math.floor(finalW * 0.6);
    const shadowH = Math.floor(size * 0.01);
    const shadowSvgH = shadowH * 6;
    const shadowLeft = productLeft + Math.floor((finalW - shadowW) / 2);
    const shadowTop = productTop + finalH - Math.floor(shadowSvgH * 0.2);

    const shadowSvg = `<svg width="${shadowW}" height="${shadowSvgH}">
      <ellipse cx="${shadowW / 2}" cy="${shadowSvgH / 2}" rx="${shadowW / 2}" ry="${shadowH}"
        fill="rgba(0,0,0,0.1)" filter="url(#b)"/>
      <defs><filter id="b"><feGaussianBlur stdDeviation="5"/></filter></defs>
    </svg>`;
    layers.push({ input: Buffer.from(shadowSvg), top: shadowTop, left: shadowLeft });
  }

  layers.push({ input: resized, top: productTop, left: productLeft });

  return sharp(textureBg)
    .composite(layers)
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function createFreePreviewAll(
  productPng: Buffer
): Promise<{ name: string; label: string; buffer: Buffer }[]> {
  const results: { name: string; label: string; buffer: Buffer }[] = [];
  const previewSize = 512;

  const svgWatermark = `
    <svg width="${previewSize}" height="${previewSize}">
      <style>.wm { fill: rgba(0,0,0,0.08); font-size: 36px; font-family: Arial; font-weight: bold; }</style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            class="wm" transform="rotate(-30, ${previewSize / 2}, ${previewSize / 2})">BgSwap</text>
    </svg>
  `;

  for (const bg of BG_OPTIONS) {
    const composited = await compositeProductOnBg(productPng, bg.color, previewSize);
    const watermarked = await sharp(composited)
      .composite([{ input: Buffer.from(svgWatermark), gravity: "center" }])
      .jpeg({ quality: 85 })
      .toBuffer();
    results.push({ name: bg.name, label: bg.label, buffer: watermarked });
  }

  return results;
}
