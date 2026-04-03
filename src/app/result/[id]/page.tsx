"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trackCheckoutClick, trackDownloadClick } from "@/lib/analytics";

interface PreviewImage {
  style: string;
  url: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  style: string;
  uploadIndex: number;
}

interface OrderStatus {
  orderId: string;
  status: string;
  previewUrl: string | null;
  previewImages: PreviewImage[];
  generatedCount: number;
  uploadCount: number;
  downloadToken: string | null;
  generatedImages: GeneratedImage[];
  plan: string | null;
  processedCount: number;
  processingCount: number;
  pendingCount: number;
  failedCount: number;
}

const STEPS = [
  { label: "Uploading", icon: "📤" },
  { label: "Removing background", icon: "✂️" },
  { label: "Generating backgrounds", icon: "🎨" },
  { label: "Almost done", icon: "✅" },
];

const BG_LABELS: Record<string, string> = {
  white: "White",
  "light-gray": "Light Gray",
  warm: "Warm",
  "cool-gray": "Cool",
  dark: "Dark",
  sunset: "Sunset",
  ocean: "Ocean",
  mint: "Mint",
  lavender: "Lavender",
  peach: "Peach",
  marble: "Marble",
  wood: "Wood",
  linen: "Linen",
  concrete: "Concrete",
  paper: "Paper",
  custom: "Custom",
};

const MARKETPLACE_OPTIONS = [
  { value: "default", label: "Default (2048px)" },
  { value: "amazon", label: "Amazon (2000px)" },
  { value: "etsy", label: "Etsy (2000px)" },
  { value: "shopify", label: "Shopify (2048px)" },
  { value: "ebay", label: "eBay (1600px)" },
  { value: "instagram", label: "Instagram (1080px)" },
];

export default function ResultPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [data, setData] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedPreview, setSelectedPreview] = useState(0);

  // Phase B options
  const [shadow, setShadow] = useState(false);
  const [padding, setPadding] = useState(0.8);
  const [marketplace, setMarketplace] = useState("default");
  const [customColor, setCustomColor] = useState("");
  const [enhance, setEnhance] = useState(false);

  // Gallery state for completed orders
  const [activeProduct, setActiveProduct] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Save options to DB when changed
  const saveOptions = useCallback(async () => {
    const opts: Record<string, unknown> = { shadow, padding, marketplace, enhance };
    if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
      opts.customColor = customColor;
    }
    await fetch(`/api/options/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    }).catch(() => {});
  }, [orderId, shadow, padding, marketplace, customColor, enhance]);

  useEffect(() => {
    if (data?.status === "sample_generated") {
      saveOptions();
    }
  }, [shadow, padding, marketplace, customColor, data?.status, saveOptions]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${orderId}`);
        const json = await res.json();
        setData(json);
        setLoading(false);

        // Keep polling if paid and still processing
        const stillProcessing =
          (json.pendingCount > 0 || json.processingCount > 0) &&
          (json.status === "paid" || json.status === "completed");
        // Also poll for legacy flow (no process_status yet)
        const uploadCount = json.uploadCount || 1;
        const expectedTotal = uploadCount * 15;
        const legacyProcessing =
          json.status === "paid" && json.generatedCount < expectedTotal;

        if (stillProcessing || legacyProcessing) {
          setTimeout(poll, 3000);
        }
      } catch { setLoading(false); }
    };
    poll();
  }, [orderId]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <div className="text-4xl mb-4" aria-hidden="true">{STEPS[loadingStep].icon}</div>
          <div className="text-2xl font-bold mb-2">{STEPS[loadingStep].label}...</div>
          <p className="text-gray-500">Usually takes under 30 seconds</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i <= loadingStep ? "bg-blue-600 w-8" : "bg-gray-200 w-2"
              }`}
            />
          ))}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">😕</div>
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Link href="/upload" className="text-blue-600 underline">Try again</Link>
      </main>
    );
  }

  const previews = data.previewImages || [];
  const currentPreview = previews[selectedPreview] || (data.previewUrl ? { style: "white", url: data.previewUrl } : null);
  const uploadCount = data.uploadCount || 1;
  const expectedBgCount = 15 + (customColor ? 1 : 0); // 5 solid + 5 gradient + 5 texture + optional custom
  const expectedTotal = uploadCount * expectedBgCount;
  const progressPercent = Math.min(100, Math.round((data.generatedCount / expectedTotal) * 100));

  // Group generated images by product for completed gallery
  const groupedImages: Record<number, GeneratedImage[]> = {};
  if (data.generatedImages?.length) {
    for (const img of data.generatedImages) {
      const idx = img.uploadIndex ?? 0;
      if (!groupedImages[idx]) groupedImages[idx] = [];
      groupedImages[idx].push(img);
    }
  }
  const productTabs = Object.keys(groupedImages).map(Number).sort((a, b) => a - b);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Preview Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Free Preview</h1>
        <p className="text-gray-500">Preview generated. Like what you see?</p>
      </div>

      {/* Multi-product notice */}
      {uploadCount > 1 && data.status === "sample_generated" && (
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6 text-center">
          Previewing product 1 of {uploadCount}. All {uploadCount} products will be processed after purchase.
        </div>
      )}

      {/* Preview Image */}
      {currentPreview && (
        <div className="mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mx-auto max-w-sm">
            <img
              src={currentPreview.url}
              alt={`Preview on ${BG_LABELS[currentPreview.style] || currentPreview.style} background`}
              className="w-full aspect-square object-contain rounded-lg"
            />
          </div>
          <p className="text-center text-sm font-medium text-blue-600 mt-2">
            {BG_LABELS[currentPreview.style] || currentPreview.style} background
          </p>
        </div>
      )}

      {/* 5 Background Thumbnails */}
      {previews.length > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {previews.map((p, i) => (
            <button
              key={p.style}
              onClick={() => setSelectedPreview(i)}
              className={`rounded-lg overflow-hidden border-2 transition w-14 h-14 ${
                i === selectedPreview ? "border-blue-600 shadow-md" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img
                src={p.url}
                alt={BG_LABELS[p.style] || p.style}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mb-8">
        512px preview with watermark &middot; Full resolution without watermark after purchase
      </p>

      {/* Options + CTA for sample_generated */}
      {data.status === "sample_generated" && (
        <div>
          {/* Customization Options */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <p className="font-semibold text-sm mb-4">Customize your output:</p>

            {/* Marketplace Preset */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Output size</label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MARKETPLACE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Enhance Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm text-gray-700">Enhance quality</label>
                <p className="text-[10px] text-gray-500">Sharpen + boost colors</p>
              </div>
              <button
                onClick={() => setEnhance(!enhance)}
                className={`relative w-10 h-6 rounded-full transition ${enhance ? "bg-blue-600" : "bg-gray-300"}`}
                role="switch"
                aria-checked={enhance}
                aria-label="Toggle image enhancement"
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${enhance ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>

            {/* Shadow Toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-gray-700">Drop shadow</label>
              <button
                onClick={() => setShadow(!shadow)}
                className={`relative w-10 h-6 rounded-full transition ${shadow ? "bg-blue-600" : "bg-gray-300"}`}
                role="switch"
                aria-checked={shadow}
                aria-label="Toggle drop shadow"
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${shadow ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>

            {/* Padding Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-700">Product fill</label>
                <span className="text-xs text-gray-500">{Math.round(padding * 100)}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={Math.round(padding * 100)}
                onChange={(e) => setPadding(Number(e.target.value) / 100)}
                className="w-full accent-blue-600"
                aria-label="Product fill percentage"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>More whitespace</span>
                <span>Fill frame</span>
              </div>
            </div>

            {/* Custom Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Custom background color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColor || "#ffffff"}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  aria-label="Pick custom background color"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#FF6B35"
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Optional — adds a 6th background with your brand color</p>
            </div>
          </div>

          {/* What you get */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <p className="font-semibold text-sm mb-3">You&apos;ll get:</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Full resolution ({MARKETPLACE_OPTIONS.find(m => m.value === marketplace)?.label || "2048px"})
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                {customColor ? "16" : "15"} backgrounds per product{shadow ? " + drop shadow" : ""}
              </div>
              {uploadCount > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  All {uploadCount} products processed ({uploadCount * (customColor ? 16 : 15)} total images)
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Product fill: {Math.round(padding * 100)}%
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                ZIP download + email delivery
              </div>
            </div>
          </div>

          {/* Payment buttons */}
          {process.env.NEXT_PUBLIC_POLAR_CHECKOUT_STARTER ? (
            <div className="flex flex-col gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_POLAR_CHECKOUT_STARTER}?metadata[order_id]=${orderId}&metadata[plan]=starter`}
                onClick={() => trackCheckoutClick("starter")}
                className="inline-block w-full bg-white text-blue-600 font-semibold text-lg px-8 py-4 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition text-center"
              >
                Starter &mdash; 10 Products &rarr; $4.99
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_POLAR_CHECKOUT_PRO}?metadata[order_id]=${orderId}&metadata[plan]=pro`}
                onClick={() => trackCheckoutClick("pro")}
                className="inline-block w-full bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition cta-pulse relative text-center"
              >
                <span className="absolute -top-2 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>
                Pro &mdash; 100 Products &rarr; $29
              </a>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              Payment not configured yet. Check back soon.
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <span aria-hidden="true">🔒</span><span>Secure payment</span>
            <span aria-hidden="true">↩</span><span>7-day refund guarantee</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Payments securely processed by Polar.sh</p>
        </div>
      )}

      {/* Bulk upload CTA for paid/completed orders with remaining slots */}
      {(data.status === "paid" || data.status === "completed") && data.plan && (() => {
        const maxProducts = data.plan === "pro" ? 100 : 10;
        const remaining = maxProducts - (data.uploadCount || 0);
        return remaining > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
            <p className="font-semibold text-green-800 mb-2">
              {data.uploadCount <= 1 ? "Ready to upload your products!" : `${remaining} product slots remaining`}
            </p>
            <p className="text-sm text-green-600 mb-4">
              {data.uploadCount || 0} of {maxProducts} products used ({data.plan === "pro" ? "Pro" : "Starter"} plan).
              Each product gets 15 backgrounds.
            </p>
            <Link
              href={`/order/${orderId}/upload`}
              className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Upload More Products ({remaining} remaining)
            </Link>
          </div>
        ) : null;
      })()}

      {/* Processing after payment */}
      {data.status === "paid" && (
        <div className="text-center">
          <div className="text-xl font-semibold mb-4">Generating your photos...</div>

          {/* Per-product progress (bulk) */}
          {uploadCount > 1 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(((data.processedCount || 0) / uploadCount) * 100)}%` }}
                />
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Product {(data.processedCount || 0) + 1} of {uploadCount}
                {data.processingCount > 0 && " — processing..."}
              </p>
              {uploadCount > 1 && (
                <p className="text-gray-400 text-xs mt-1">
                  Estimated ~{Math.max(1, Math.round(((data.pendingCount || 0) + (data.processingCount || 0)) * 10 / 60 / 3))} min remaining
                </p>
              )}
            </div>
          )}

          {/* Background generation progress */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm">
            {data.generatedCount} of {expectedTotal} backgrounds generated
            {uploadCount > 1 && ` (${uploadCount} products)`}
          </p>

          {(data.failedCount || 0) > 0 && (
            <div className="mt-3">
              <p className="text-orange-500 text-sm">
                {data.failedCount} product(s) failed
              </p>
              <button
                onClick={async () => {
                  setRetrying(true);
                  try {
                    const res = await fetch("/api/retry", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderId }),
                    });
                    if (res.ok) window.location.reload();
                  } catch {}
                  setRetrying(false);
                }}
                disabled={retrying}
                className="mt-2 text-sm bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {retrying ? "Retrying..." : "Retry Now"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completed — Gallery + Download */}
      {data.status === "completed" && (
        <div>
          <div className="text-center mb-6">
            {(data.failedCount || 0) > 0 ? (
              <>
                <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
                <div className="text-orange-600 text-xl font-bold mb-2">
                  Completed with {data.failedCount} failed product{(data.failedCount || 0) > 1 ? "s" : ""}
                </div>
                <p className="text-gray-500 text-sm">
                  {data.processedCount || 0} of {uploadCount} products processed successfully
                  ({data.generatedCount} photos).
                  {(data.failedCount || 0) > 0 && ` ${data.failedCount} could not be processed after retries.`}
                </p>
                <button
                  onClick={async () => {
                    setRetrying(true);
                    try {
                      const res = await fetch("/api/retry", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId }),
                      });
                      if (res.ok) window.location.reload();
                    } catch {}
                    setRetrying(false);
                  }}
                  disabled={retrying}
                  className="mt-3 inline-block bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {retrying ? "Retrying..." : `Retry Failed Product${(data.failedCount || 0) > 1 ? "s" : ""}`}
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
                <div className="text-green-600 text-xl font-bold mb-2">Your product photos are ready!</div>
                <p className="text-gray-500 text-sm">
                  {data.generatedCount} photos{productTabs.length > 1 ? ` across ${productTabs.length} products` : ""}.
                </p>
              </>
            )}
          </div>

          {/* Product tabs for multi-product orders */}
          {productTabs.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {productTabs.map((idx, i) => (
                <button
                  key={idx}
                  onClick={() => setActiveProduct(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    i === activeProduct
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Product {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Result gallery grid */}
          {productTabs.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
              {(groupedImages[productTabs[activeProduct]] || []).map((img) => (
                <div key={img.id} className="group relative">
                  <img
                    src={img.url}
                    alt={`${BG_LABELS[img.style] || img.style} background`}
                    className="w-full aspect-square object-cover rounded-lg shadow-sm border border-gray-100"
                  />
                  <div className="text-center text-[10px] text-gray-500 mt-1">
                    {BG_LABELS[img.style] || img.style}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Download button */}
          {data.downloadToken && (
            <Link
              href={`/download/${data.downloadToken}`}
              onClick={() => trackDownloadClick(orderId)}
              className="inline-block w-full bg-green-600 text-white font-semibold text-lg px-8 py-4 rounded-lg hover:bg-green-700 transition text-center"
            >
              Download All Photos &rarr;
            </Link>
          )}
          <p className="text-xs text-gray-500 mt-3 text-center">Download link also sent to your email.</p>
        </div>
      )}
    </main>
  );
}
