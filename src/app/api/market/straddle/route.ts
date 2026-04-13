import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOURCE_URL = "https://915.groww.in/straddle-chart";

type StraddleRow = {
  indexName: string;
  lastTraded: number;
  dayChange: number;
  dayChangePercent: number;
  open: number;
  high: number;
  low: number;
  lastClose: number;
  atmStrike: number;
  straddlePrice: number;
};

function cleanNumber(raw: string) {
  const normalized = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/g, " ").trim();
}

function parseRows(html: string): StraddleRow[] {
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];
  const tbody = tbodyMatch[1];
  const trMatches = [...tbody.matchAll(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi)];
  const rows: StraddleRow[] = [];

  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi)].map((x) => stripTags(x[1]));
    if (tdMatches.length < 9) continue;

    const indexName = tdMatches[0];
    const dayChangeFull = tdMatches[2];
    const pctMatch = dayChangeFull.match(/\(([-+]?[\d.]+)%\)/);
    const dayChangePercent = pctMatch ? Number(pctMatch[1]) : 0;
    const dayChangePart = dayChangeFull.replace(/\(.*\)/, "").trim();

    rows.push({
      indexName,
      lastTraded: cleanNumber(tdMatches[1]),
      dayChange: cleanNumber(dayChangePart),
      dayChangePercent,
      open: cleanNumber(tdMatches[3]),
      high: cleanNumber(tdMatches[4]),
      low: cleanNumber(tdMatches[5]),
      lastClose: cleanNumber(tdMatches[6]),
      atmStrike: cleanNumber(tdMatches[7]),
      straddlePrice: cleanNumber(tdMatches[8]),
    });
  }

  return rows;
}

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed upstream (${res.status})`);
    }
    const html = await res.text();
    const rows = parseRows(html);
    return NextResponse.json({
      ok: true as const,
      source: SOURCE_URL,
      rows,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        rows: [] as StraddleRow[],
        message: error instanceof Error ? error.message : "Failed to fetch straddle data",
      },
      { status: 502 },
    );
  }
}

