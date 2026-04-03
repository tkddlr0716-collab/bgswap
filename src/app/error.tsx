"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-4">😵</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-500 mb-8">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={reset}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto text-blue-600 font-semibold px-6 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
