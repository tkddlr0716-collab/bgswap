"use client";

import { useState, useEffect } from "react";

type ConsentState = "pending" | "accepted" | "rejected";

function getConsent(): ConsentState {
  if (typeof window === "undefined") return "pending";
  return (localStorage.getItem("cookie_consent") as ConsentState) || "pending";
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}

export default function CookieConsent() {
  const [state, setState] = useState<ConsentState>("pending");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = getConsent();
    setState(saved);
    if (saved === "pending") {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setState("accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("cookie_consent", "rejected");
    setState("rejected");
    setVisible(false);
  }

  if (state !== "pending" || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          We use cookies for analytics to improve your experience.
          See our{" "}
          <a href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            aria-label="Decline cookies and analytics"
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            aria-label="Accept cookies and analytics"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
