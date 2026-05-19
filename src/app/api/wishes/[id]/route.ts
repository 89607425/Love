import { NextRequest, NextResponse } from "next/server";
import { updateWish, deleteWish } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const wish = updateWish(Number(id), data);
  if (!wish) {
    return NextResponse.json({ error: "愿望不存在" }, { status: 404 });
  }
  return NextResponse.json(wish);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteWish(Number(id));
  if (!ok) {
    return NextResponse.json({ error: "愿望不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
