"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

async function compressImage(file: File): Promise<File> {
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

interface UploadItem {
  file: File;
  previewUrl: string;
  status: "waiting" | "uploading" | "done" | "failed";
  retries: number;
}

export default function BulkUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [alreadyUploaded, setAlreadyUploaded] = useState(0);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const maxPhotos = plan === "pro" ? 100 : 10;
  const remaining = maxPhotos - alreadyUploaded;

  // Verify order is paid
  useEffect(() => {
    fetch(`/api/status/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrderStatus(data.status);
        setPlan(data.plan);
        setAlreadyUploaded(data.uploadCount || 0);
      })
      .catch(() => setError("Failed to load order"));
  }, [orderId]);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const accepted = Array.from(fileList).filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
      );
      setItems((prev) => {
        const available = remaining - prev.length;
        if (available <= 0) return prev;
        const toAdd = accepted.slice(0, available).map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
          status: "waiting" as const,
          retries: 0,
        }));
        return [...prev, ...toAdd];
      });
    },
    [remaining]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeItem = (index: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    setError("");
    setUploading(true);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "done") continue;

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "uploading" } : item
        )
      );

      let success = false;
      let retries = 0;
      const maxRetries = 3;

      while (!success && retries < maxRetries) {
        try {
          const compressed = await compressImage(items[i].file);
          const formData = new FormData();
          formData.append("orderId", orderId);
          formData.append(
            "files",
            new File([compressed], `photo-${i + 1}.jpg`, {
              type: compressed.type,
            })
          );

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Upload failed (${res.status})`);
          }

          success = true;
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "done" } : item
            )
          );
        } catch (err) {
          retries++;
          if (retries >= maxRetries) {
            setItems((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? { ...item, status: "failed", retries }
                  : item
              )
            );
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Photo ${i + 1} failed: ${msg}`);
          }
        }
      }
    }

    setUploading(false);

    // Navigate to result page to start processing
    const allDone = items.every(
      (item) => item.status === "done" || item.status === "failed"
    );
    if (allDone) {
      router.push(`/result/${orderId}`);
    }
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const failedCount = items.filter((i) => i.status === "failed").length;

  // Not loaded yet
  if (orderStatus === null) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 mt-4">Loading order...</p>
      </main>
    );
  }

  // Not paid
  if (orderStatus !== "paid" && orderStatus !== "completed") {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">
          {orderStatus === "sample_generated" ? "💳" : "😕"}
        </div>
        <h1 className="text-2xl font-bold mb-4">
          {orderStatus === "sample_generated"
            ? "Payment required"
            : "Order not found"}
        </h1>
        <p className="text-gray-500 mb-6">
          {orderStatus === "sample_generated"
            ? "Complete payment first to upload your product photos."
            : "This order doesn't exist or hasn't been paid yet."}
        </p>
        <Link href="/upload" className="text-blue-600 underline">
          Go to upload
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {plan === "pro" ? "Pro" : "Starter"} Plan
        </div>
        <h1 className="text-3xl font-bold mb-2">Upload Your Products</h1>
        <p className="text-gray-500">
          Upload up to {maxPhotos} product photos. Each will get 15 professional
          backgrounds.
        </p>
        {alreadyUploaded > 0 && (
          <p className="text-sm text-blue-600 mt-1">
            {alreadyUploaded} already uploaded &middot; {remaining} remaining
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => document.getElementById("bulk-file-input")?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-6 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : items.length > 0
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input
          id="bulk-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="text-4xl mb-3" aria-hidden="true">
          📸
        </div>
        <p className="text-lg font-medium text-gray-700">
          <span className="hidden md:inline">
            Drag &amp; drop product photos here
          </span>
          <span className="md:hidden">Tap to select photos</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          JPG, PNG, WebP &middot; Up to {remaining} photos &middot;
          Auto-compressed
        </p>
      </div>

      {/* File List */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {items.length} photo{items.length !== 1 && "s"} selected
            </p>
            {!uploading && (
              <button
                onClick={() => {
                  items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                  setItems([]);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="relative group">
                <img
                  src={item.previewUrl}
                  alt={`Product ${i + 1}`}
                  className={`w-full aspect-square object-cover rounded-lg border ${
                    item.status === "done"
                      ? "border-green-400"
                      : item.status === "failed"
                      ? "border-red-400"
                      : item.status === "uploading"
                      ? "border-blue-400"
                      : "border-gray-200"
                  }`}
                />
                {item.status === "uploading" && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {item.status === "done" && (
                  <div className="absolute top-0.5 right-0.5 bg-green-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                    <span aria-hidden="true">&#10003;</span>
                  </div>
                )}
                {item.status === "failed" && (
                  <div className="absolute top-0.5 right-0.5 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                    !
                  </div>
                )}
                {!uploading && item.status === "waiting" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(i);
                    }}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(((doneCount + failedCount) / items.length) * 100)}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Uploading {doneCount + failedCount + 1} of {items.length}...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && !uploading && (
        <button
          onClick={uploadAll}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition text-lg"
        >
          Upload {items.length} Photo{items.length !== 1 && "s"} &amp; Start
          Processing
        </button>
      )}

      {/* Info */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-500">
          <li>Select your product photos (up to {maxPhotos})</li>
          <li>Photos are uploaded and compressed automatically</li>
          <li>Each product gets 15 professional backgrounds</li>
          <li>
            Processing takes ~30 seconds per product, 3 at a time (~
            {Math.round((maxPhotos * 30) / 60 / 3)} min for {maxPhotos})
          </li>
          <li>Download all as ZIP when done</li>
        </ol>
      </div>
    </main>
  );
}
