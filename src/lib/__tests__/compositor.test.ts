import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { compositeProductOnBg, compositeAllBackgrounds, BG_OPTIONS, createFreePreview, createFreePreviewAll, validateHexColor, MARKETPLACE_PRESETS, TEXTURE_OPTIONS, compositeProductOnTexture, createTextureBg } from "../compositor";

// Create a simple test PNG: 200x200 red square on transparent background
async function createTestProduct(): Promise<Buffer> {
  return sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 255 },
    },
  })
    .png()
    .toBuffer();
}

describe("compositeProductOnBg", () => {
  it("produces a JPEG of correct dimensions", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 });

    const meta = await sharp(result).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(2048);
    expect(meta.height).toBe(2048);
  });

  it("respects custom size parameter", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 }, 512);

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it("centers the product on the canvas", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 }, 512);

    const { data } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const cx = 256;
    const cy = 256;
    const idx = (cy * 512 + cx) * 3;
    expect(data[idx]).toBeGreaterThan(200);
  });

  it("fills background with specified color", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnBg(product, { r: 30, g: 30, b: 35 }, 1024);

    // Sample top-left corner — should be dark background
    const { data } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(data[0]).toBeLessThan(50); // R
    expect(data[1]).toBeLessThan(50); // G
    expect(data[2]).toBeLessThan(50); // B
  });
});

describe("compositeAllBackgrounds", () => {
  it("produces 5 results by default", async () => {
    const product = await createTestProduct();
    const results = await compositeAllBackgrounds(product);

    expect(results).toHaveLength(5);
    expect(results.map((r) => r.name)).toEqual(
      BG_OPTIONS.map((bg) => bg.name)
    );
  });

  it("each result is a valid JPEG buffer", async () => {
    const product = await createTestProduct();
    const results = await compositeAllBackgrounds(product);

    for (const r of results) {
      const meta = await sharp(r.buffer).metadata();
      expect(meta.format).toBe("jpeg");
      expect(meta.width).toBe(2048);
    }
  });
});

describe("createFreePreview", () => {
  it("produces a 512px watermarked JPEG", async () => {
    const product = await createTestProduct();
    const preview = await createFreePreview(product);

    const meta = await sharp(preview).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it("is smaller than full-size output", async () => {
    const product = await createTestProduct();
    const full = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 });
    const preview = await createFreePreview(product);

    expect(preview.length).toBeLessThan(full.length);
  });
});

describe("createFreePreviewAll", () => {
  it("produces 5 watermarked 512px thumbnails", async () => {
    const product = await createTestProduct();
    const results = await createFreePreviewAll(product);

    expect(results).toHaveLength(5);
    for (const r of results) {
      const meta = await sharp(r.buffer).metadata();
      expect(meta.format).toBe("jpeg");
      expect(meta.width).toBe(512);
    }
  });
});

describe("validateHexColor", () => {
  it("parses valid hex colors", () => {
    expect(validateHexColor("#FF6B35")).toEqual({ r: 255, g: 107, b: 53 });
    expect(validateHexColor("000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(validateHexColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("accepts options object with shadow and padding", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 }, {
      size: 512,
      shadow: true,
      padding: 0.9,
    });
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(512);
    expect(meta.format).toBe("jpeg");
  });

  it("clamps padding to valid range", async () => {
    const product = await createTestProduct();
    // padding 0.3 should clamp to 0.6
    const result = await compositeProductOnBg(product, { r: 255, g: 255, b: 255 }, {
      size: 256,
      padding: 0.3,
    });
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(256);
  });
});

describe("MARKETPLACE_PRESETS", () => {
  it("contains amazon, etsy, shopify presets", () => {
    expect(MARKETPLACE_PRESETS.amazon.size).toBe(2000);
    expect(MARKETPLACE_PRESETS.etsy.size).toBe(2000);
    expect(MARKETPLACE_PRESETS.shopify.size).toBe(2048);
    expect(MARKETPLACE_PRESETS.instagram.size).toBe(1080);
  });
});

describe("validateHexColor", () => {
  it("rejects invalid hex colors", () => {
    expect(validateHexColor("#ZZZZZZ")).toBeNull();
    expect(validateHexColor("#")).toBeNull();
    expect(validateHexColor("")).toBeNull();
    expect(validateHexColor("#FFF")).toBeNull(); // 3-char not supported
    expect(validateHexColor("not-a-color")).toBeNull();
  });
});

describe("TEXTURE_OPTIONS", () => {
  it("has 5 texture presets", () => {
    expect(TEXTURE_OPTIONS).toHaveLength(5);
    expect(TEXTURE_OPTIONS.map((t) => t.name)).toEqual([
      "marble", "wood", "linen", "concrete", "paper",
    ]);
  });
});

describe("createTextureBg", () => {
  it("produces a JPEG of correct dimensions", async () => {
    const bg = await createTextureBg(512, TEXTURE_OPTIONS[0]);
    const meta = await sharp(bg).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });
});

describe("compositeProductOnTexture", () => {
  it("produces a JPEG with product on texture", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnTexture(product, TEXTURE_OPTIONS[0], { size: 512 });
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it("works with all texture options", async () => {
    const product = await createTestProduct();
    for (const tex of TEXTURE_OPTIONS) {
      const result = await compositeProductOnTexture(product, tex, { size: 256 });
      const meta = await sharp(result).metadata();
      expect(meta.format).toBe("jpeg");
      expect(meta.width).toBe(256);
    }
  });

  it("respects shadow option", async () => {
    const product = await createTestProduct();
    const result = await compositeProductOnTexture(product, TEXTURE_OPTIONS[0], {
      size: 512,
      shadow: true,
    });
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe("jpeg");
  });
});
