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

function cached(data: unknown, maxAge = 60) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=300` },
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
    return cached(locs, 120);
  }

  if (location) {
    const memories = await getMemoriesByLocation(location);
    return cached(memories, 60);
  }

  if (datesOnly && year && !month) {
    const dates = await getDatesWithMemoriesByYear(Number(year));
    return cached(dates, 60);
  }

  if (datesOnly && year && month) {
    const dates = await getDatesWithMemories(Number(year), Number(month));
    return cached(dates, 30);
  }

  if (dateTags && year) {
    const tags = await getDateTags(Number(year), month ? Number(month) : null);
    return cached(tags, 60);
  }

  if (date) {
    const memories = await getMemoriesByDate(date);
    return cached(memories, 30);
  }

  if (year && month) {
    const memories = await getMemoriesByMonth(Number(year), Number(month));
    return cached(memories, 60);
  }

  const memories = await getAllMemories();
  return cached(memories, 60);
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
