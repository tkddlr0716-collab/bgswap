import Replicate from "replicate";

let _replicate: Replicate | null = null;

function getReplicate(): Replicate {
  if (!_replicate) {
    _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  }
  return _replicate;
}

export async function removeBackground(imageUrl: string): Promise<string> {
  // SSRF defense: only allow R2 public URLs
  const allowedPrefix = process.env.R2_PUBLIC_URL;
  if (allowedPrefix && !imageUrl.startsWith(allowedPrefix)) {
    throw new Error(`SSRF blocked: URL must start with ${allowedPrefix}`);
  }

  const MAX_RETRIES = 2;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // 45-second timeout to stay within Vercel's 60s function limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const output = await getReplicate().run("lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1", {
        input: { image: imageUrl },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return String(output);
    } catch (err) {
      lastErr = controller.signal.aborted
        ? new Error("Replicate timeout: background removal took longer than 45 seconds")
        : err;
      if (attempt < MAX_RETRIES) {
        console.warn(`removeBackground attempt ${attempt + 1} failed, retrying in ${(attempt + 1)}s...`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr;
}
