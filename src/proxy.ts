import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL || "https://bgswap.io",
  "http://localhost:3000",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply CSRF/CORS protection to API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const method = request.method;

    // CORS preflight
    if (method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
        response.headers.set("Access-Control-Allow-Origin", origin);
      }
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }

    // CSRF protection for state-changing requests
    if (method === "POST") {
      // Allow webhook callbacks from Polar.sh (no origin header)
      if (pathname === "/api/webhook/polar") {
        return NextResponse.next();
      }

      // Allow cron calls (Vercel Cron, no origin)
      if (pathname === "/api/cron/cleanup") {
        return NextResponse.next();
      }

      // For all other POST requests, verify origin
      if (origin) {
        const isAllowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
        if (!isAllowed) {
          return NextResponse.json(
            { error: "Forbidden: invalid origin" },
            { status: 403 }
          );
        }
      }
      // No origin header on same-origin requests from some browsers — allow
      // But block if Referer is also missing (likely automated request)
      if (!origin && !request.headers.get("referer")) {
        // Allow if it has our webhook signature (Polar) or cron secret
        const hasAuth =
          request.headers.get("x-polar-signature") ||
          request.nextUrl.searchParams.get("secret");
        if (!hasAuth) {
          return NextResponse.json(
            { error: "Forbidden: missing origin" },
            { status: 403 }
          );
        }
      }
    }

    // Set CORS headers on response
    const response = NextResponse.next();
    if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    // Remove Vercel's default * CORS
    if (!origin || !ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
      response.headers.delete("Access-Control-Allow-Origin");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
