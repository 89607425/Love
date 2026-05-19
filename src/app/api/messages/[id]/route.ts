import { NextRequest, NextResponse } from "next/server";
import { deleteMessage } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteMessage(Number(id));
  if (!ok) {
    return NextResponse.json({ error: "留言不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
