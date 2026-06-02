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
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const date = searchParams.get("date");
  const datesOnly = searchParams.get("datesOnly");
  const location = searchParams.get("location");
  const locationsOnly = searchParams.get("locationsOnly");

  if (locationsOnly) {
    const locs = await getAllLocationsWithMemories();
    return NextResponse.json(locs);
  }

  if (location) {
    const memories = await getMemoriesByLocation(location);
    return NextResponse.json(memories);
  }

  if (datesOnly && year && !month) {
    const dates = await getDatesWithMemoriesByYear(Number(year));
    return NextResponse.json(dates);
  }

  if (datesOnly && year && month) {
    const dates = await getDatesWithMemories(Number(year), Number(month));
    return NextResponse.json(dates);
  }

  if (date) {
    const memories = await getMemoriesByDate(date);
    return NextResponse.json(memories);
  }

  if (year && month) {
    const memories = await getMemoriesByMonth(Number(year), Number(month));
    return NextResponse.json(memories);
  }

  const memories = await getAllMemories();
  return NextResponse.json(memories);
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
