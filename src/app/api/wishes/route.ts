import { NextRequest, NextResponse } from "next/server";
import { getWishes, createWish } from "@/lib/db";

export async function GET() {
  const wishes = await getWishes();
  return NextResponse.json(wishes);
}

export async function POST(req: NextRequest) {
  const { title, description, author } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "愿望标题不能为空" }, { status: 400 });
  }
  const wish = await createWish({
    title: title.trim(),
    description: description || "",
    author: author || "我",
  });
  return NextResponse.json(wish, { status: 201 });
}
