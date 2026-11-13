import { NextRequest, NextResponse } from "next/server";
import {
  getMemoriesByMonth,
  getMemoriesByDate,
  getAllMemories,
  createMemory,
  getDatesWithMemories,
  getDatesWithMemoriesByYear,
  getMemoriesByLocation,
  getAllLocationsWithMemories,
  getDateTags,
} from "@/lib/db";

function cached(data: unknown) {
  // 私人数据：不进 CDN/浏览器缓存，避免增删改后读到旧列表
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  const datesOnly = searchParams.get("datesOnly");
  const dateTags = searchParams.get("dateTags");
  const location = searchParams.get("location");
  const locationsOnly = searchParams.get("locationsOnly");

  if (locationsOnly) {
    const locs = await getAllLocationsWithMemories();
    return cached(locs);
  }

  if (location) {
    const memories = await getMemoriesByLocation(location);
    return cached(memories);
  }

  if (datesOnly && year && !month) {
    const dates = await getDatesWithMemoriesByYear(Number(year));
    return cached(dates);
  }

  if (datesOnly && year && month) {
    const dates = await getDatesWithMemories(Number(year), Number(month));
    return cached(dates);
  }

  if (dateTags && year) {
    const tags = await getDateTags(Number(year), month ? Number(month) : null);
    return cached(tags);
  }

  if (date) {
    const memories = await getMemoriesByDate(date);
    return cached(memories);
  }

  if (year && month) {
    const memories = await getMemoriesByMonth(Number(year), Number(month));
    return cached(memories);
  }

  const memories = await getAllMemories();
  return cached(memories);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { date, content, images, tags, author, location } = data;

  if (!date) {
    return NextResponse.json({ error: "日期不能为空" }, { status: 400 });
  }

  const memory = await createMemory({
    date,
    content: content || "",
    images: images || [],
    tags: tags || [],
    author: author || "他",
    location: location || "",
  });

  return NextResponse.json(memory, { status: 201 });
}
