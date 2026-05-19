import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage } from "@/lib/db";

export async function GET() {
  const messages = await getMessages();
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { content, author } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }
  const message = await createMessage({ content: content.trim(), author: author || "我" });
  return NextResponse.json(message, { status: 201 });
}
