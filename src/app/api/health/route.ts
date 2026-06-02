import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET() {
  const result: Record<string, string | boolean> = {};

  result.has_databae_url = Boolean(process.env.DATABASE_URL);
  result.db_url_prefix = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "(unknown host)"
    : "MISSING";

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ...result, status: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    await initDb();
    result.tables_created = true;
    result.status = "ok";
    return NextResponse.json(result);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    result.status = "init_failed";
    return NextResponse.json(result, { status: 500 });
  }
}
