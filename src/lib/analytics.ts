"use client";

import { capture } from "@/components/PostHogProvider";

// Debounce helper — prevents excessive event firing
const firedEvents = new Set<string>();

function oncePerSession(key: string, fn: () => void) {
  if (firedEvents.has(key)) return;
  firedEvents.add(key);
  fn();
}

// ── Landing page events ──

export function trackSectionView(sectionId: string) {
  oncePerSession(`section_view:${sectionId}`, () => {
    capture("landing_section_view", { section_id: sectionId });
  });
}

let sectionTimers: Record<string, number> = {};

export function trackSectionEnter(sectionId: string) {
  sectionTimers[sectionId] = Date.now();
}

export function trackSectionLeave(sectionId: string) {
  const entered = sectionTimers[sectionId];
  if (!entered) return;
  const dwell = Date.now() - entered;
  if (dwell >= 3000) {
    capture("landing_section_dwell", {
      section_id: sectionId,
      dwell_time_ms: dwell,
    });
  }
  delete sectionTimers[sectionId];
}

// ── Scroll depth ──

const scrollDepthsFired = new Set<number>();

export function trackScrollDepth(percent: number) {
  const bucket = percent >= 100 ? 100 : percent >= 75 ? 75 : percent >= 50 ? 50 : percent >= 25 ? 25 : 0;
  if (bucket === 0 || scrollDepthsFired.has(bucket)) return;
  scrollDepthsFired.add(bucket);
  capture("scroll_depth", { depth_percent: bucket });
}

// ── CTA events ──

let hoverTimers: Record<string, NodeJS.Timeout> = {};

export function trackCtaHoverStart(buttonId: string) {
  hoverTimers[buttonId] = setTimeout(() => {
    capture("cta_hover", { button_id: buttonId });
  }, 500); // 500ms threshold
}

export function trackCtaHoverEnd(buttonId: string) {
  if (hoverTimers[buttonId]) {
    clearTimeout(hoverTimers[buttonId]);
    delete hoverTimers[buttonId];
  }
}

export function trackCtaClick(buttonId: string, extra?: Record<string, unknown>) {
  trackCtaHoverEnd(buttonId);
  capture("cta_click", { button_id: buttonId, ...extra });
}

// ── Upload events ──

export function trackFileSelect(method: string, fileCount: number, timeToSelectMs: number) {
  capture("file_select", { method, file_count: fileCount, time_to_select_ms: timeToSelectMs });
}

export function trackUploadSubmit(fileCount: number, totalSizeBytes: number) {
  capture("upload_submit", { file_count: fileCount, total_size_bytes: totalSizeBytes });
}

export function trackUploadComplete(orderId: string, durationMs: number) {
  capture("upload_complete", { order_id: orderId, duration_ms: durationMs });
}

export function trackUploadError(errorType: string) {
  capture("upload_error", { error_type: errorType });
}

// ── Result page events ──

export function trackPreviewViewed(orderId: string, previewCount: number) {
  capture("preview_viewed", { order_id: orderId, preview_count: previewCount });
}

export function trackPreviewBrowse(orderId: string, style: string) {
  capture("preview_browse", { order_id: orderId, style });
}

export function trackCheckoutClick(plan: string) {
  capture("checkout_click", { plan });
}

export function trackDownloadClick(orderId: string) {
  capture("download_click", { order_id: orderId });
}

// ── FAQ events ──

export function trackFaqToggle(questionIndex: number, action: "open" | "close") {
  capture("faq_toggle", { question_index: questionIndex, action });
}

// ── Exit intent ──

export function setupExitIntent(page: string) {
  if (typeof window === "undefined") return;

  // Desktop: mouse leaves viewport
  const handleMouseLeave = (e: MouseEvent) => {
    if (e.clientY <= 0) {
      capture("exit_intent", {
        page,
        method: "mouse_leave",
        scroll_depth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
      });
    }
  };

  // Mobile: tab switch or back button
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      capture("exit_intent", {
        page,
        method: "visibility_change",
        scroll_depth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
      });
    }
  };

  document.addEventListener("mouseleave", handleMouseLeave);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("mouseleave", handleMouseLeave);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
