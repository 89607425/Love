import { NextRequest, NextResponse } from "next/server";
import {
  getMemoriesByMonth,
  getMemoriesByDate,
  getAllMemories,
  createMemory,
  getDatesWithMemories,
} from "@/lib/db";

const uploadDir = "public/uploads";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  const datesOnly = searchParams.get("datesOnly");

  if (datesOnly && year && month) {
    const dates = getDatesWithMemories(Number(year), Number(month));
    return NextResponse.json(dates);
  }

  if (date) {
    const memories = getMemoriesByDate(date);
    return NextResponse.json(memories);
  }

  if (year && month) {
    const memories = getMemoriesByMonth(Number(year), Number(month));
    return NextResponse.json(memories);
  }

  const memories = getAllMemories();
  return NextResponse.json(memories);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { date, content, images, tags, author } = data;

  if (!date) {
    return NextResponse.json({ error: "日期不能为空" }, { status: 400 });
  }

  const memory = createMemory({
    date,
    content: content || "",
    images: images || [],
    tags: tags || [],
    author: author || "我",
  });

  return NextResponse.json(memory, { status: 201 });
}
