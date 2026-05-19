import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

export async function GET() {
  const settings = {
    start_date: await getSetting("start_date"),
    my_name: await getSetting("my_name"),
    her_name: await getSetting("her_name"),
  };
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();

  if (data.start_date !== undefined) await setSetting("start_date", data.start_date);
  if (data.my_name !== undefined) await setSetting("my_name", data.my_name);
  if (data.her_name !== undefined) await setSetting("her_name", data.her_name);

  return NextResponse.json({
    start_date: await getSetting("start_date"),
    my_name: await getSetting("my_name"),
    her_name: await getSetting("her_name"),
  });
}
