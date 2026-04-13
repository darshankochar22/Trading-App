import { NextResponse } from "next/server";
import { fetchNseIpos } from "@/lib/nseMarket";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchNseIpos();
    return NextResponse.json({ ok: true as const, data, asOf: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        data: [] as const,
        message: error instanceof Error ? error.message : "Unable to fetch IPO data",
      },
      { status: 500 },
    );
  }
}
