"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { capture } from "@/components/PostHogProvider";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

async function compressImage(file: File): Promise<File> {
  // Always compress to keep total payload under Vercel's 4.5MB limit
  // Target ~800KB per file so 5 files ≈ 4MB
  const targetSize = 800 * 1024;
  if (file.size <= targetSize && file.type === "image/jpeg") return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 1600;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      // Try quality 0.80 first, reduce if still too large
      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > targetSize && quality > 0.5) {
              tryCompress(quality - 0.1);
            } else {
              resolve(new File([blob!], `photo.jpg`, { type: "image/jpeg" }));
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress(0.80);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    setFiles(dropped.slice(0, 1));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files!).slice(0, 1));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError("");
    if (!files.length) { setError("Please upload at least one product photo."); return; }
    if (!email) { setError("Please enter your email address."); return; }
    if (!consent) { setError("Please agree to the terms to continue."); return; }

    setUploading(true);
    capture("upload_started", { fileCount: files.length });

    try {
      const formData = new FormData();
      formData.append("email", email);
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        const ext = compressed.name.split(".").pop() || "jpg";
        formData.append("files", new File([compressed], `photo-${i + 1}.${ext}`, { type: compressed.type }));
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({ error: `Upload failed (${res.status})` }));
      if (!res.ok) { setError(data.error || `Upload failed (${res.status})`); setUploading(false); return; }

      let recaptchaToken = "";
      if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
        try {
          recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "generate" });
        } catch { /* continue without */ }
      }

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId, mode: "free", recaptchaToken }),
      });
      const genData = await genRes.json().catch(() => ({ error: `Generation failed (${genRes.status})` }));
      if (!genRes.ok) { setError(genData.error || `Generation failed (${genRes.status})`); setUploading(false); return; }

      capture("free_sample_generated", { orderId: data.orderId });
      router.push(`/result/${data.orderId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload flow error:", msg);
      setError(`Something went wrong: ${msg}`);
      setUploading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Product Photo</h1>
        <p className="text-gray-500">
          Get a free preview with clean background. No payment needed.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-6 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : files.length > 0
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        {files.length === 0 ? (
          <>
            <div className="text-4xl mb-3" aria-hidden="true">📸</div>
            <p className="text-lg font-medium text-gray-700">
              <span className="hidden md:inline">Drag &amp; drop product photos here</span>
              <span className="md:hidden">Tap to take a photo or choose from gallery</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP &middot; 1 product photo &middot; Auto-compressed</p>
            <p className="text-xs text-gray-400 mt-2">Tip: Photograph products alone without hands for best results</p>
          </>
        ) : (
          <>
            <div className="text-2xl mb-2" aria-hidden="true">✅</div>
            <p className="text-sm font-medium text-green-700">
              Photo selected. Tap to change.
            </p>
          </>
        )}
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="flex justify-center mb-6">
          <div className="relative group w-32">
            <img
              src={URL.createObjectURL(files[0])}
              alt="Product photo"
              className="w-full aspect-square object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(0); }}
              aria-label="Remove photo"
              className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      )}

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        />
        <p className="text-xs text-gray-500 mt-1">We&apos;ll send your download link here. No spam.</p>
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-gray-500">
          I agree to the <a href="/terms" className="text-blue-600 underline">Terms</a> and{" "}
          <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
          Photos auto-delete after 7 days.
        </span>
      </label>

      {/* Error */}
      {error && (
        <div role="alert" className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <span className="shrink-0 mt-0.5" aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Removing background...
          </span>
        ) : (
          "Get Free Preview →"
        )}
      </button>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <span>🔒 Secure upload</span>
        <span>🗑 Auto-deleted in 7 days</span>
        <span>💳 No payment needed</span>
      </div>

      {RECAPTCHA_SITE_KEY && (
        <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`} strategy="lazyOnload" />
      )}
    </main>
  );
}
