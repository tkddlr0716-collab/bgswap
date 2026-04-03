import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { validateHexColor, MARKETPLACE_PRESETS } from "@/lib/compositor";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();

    // Validate options
    const options: Record<string, unknown> = {};

    if (body.shadow === true || body.shadow === false) {
      options.shadow = body.shadow;
    }

    if (typeof body.padding === "number") {
      options.padding = Math.max(0.6, Math.min(0.95, body.padding));
    }

    if (body.marketplace && MARKETPLACE_PRESETS[body.marketplace]) {
      options.marketplace = body.marketplace;
    }

    if (body.customColor) {
      const parsed = validateHexColor(body.customColor);
      if (parsed) {
        options.customColor = body.customColor;
      }
    }

    await (await ensureDb()).execute({
      sql: "UPDATE orders SET options = ? WHERE id = ?",
      args: [JSON.stringify(options), orderId],
    });

    return NextResponse.json({ saved: true, options });
  } catch (error) {
    console.error("Options save error:", error);
    return NextResponse.json({ error: "Failed to save options" }, { status: 500 });
  }
}
