import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await getMessages();
  // 私人数据：不进 CDN/浏览器缓存，否则删除后 60 秒内会拉回旧列表
  return NextResponse.json(messages, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: NextRequest) {
  const { content, author, replyTo } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }
  const message = await createMessage({
    content: content.trim(),
    author: author || "我",
    replyTo: typeof replyTo === "number" ? replyTo : null,
  });
  return NextResponse.json(message, { status: 201 });
}
