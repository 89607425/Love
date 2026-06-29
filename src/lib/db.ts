import { neon, neonConfig } from "@neondatabase/serverless";
import { pickHighestPriorityTag } from "@/lib/tags";

neonConfig.fetchConnectionCache = true;

let _sql: ReturnType<typeof neon> | null = null;
function getSql() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!);
  }
  return _sql;
}
function query(strings: TemplateStringsArray, ...params: unknown[]) {
  return getSql()(strings, ...params) as unknown as Promise<Record<string, unknown>[]>;
}

let initialized = false;

export async function initDb() {
  if (initialized) return;
  console.log("[initDb] Creating tables...");
  try {
  await query`CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    author TEXT NOT NULL DEFAULT '他',
    location TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  try {
    await query`ALTER TABLE memories ADD COLUMN location TEXT NOT NULL DEFAULT ''`;
  } catch {
    // Column already exists
  }
  await query`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`;
  await query`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT '他',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await query`CREATE TABLE IF NOT EXISTS wishes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    author TEXT NOT NULL DEFAULT '他',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await query`INSERT INTO settings (key, value) VALUES ('start_date', '') ON CONFLICT (key) DO NOTHING`;
  await query`INSERT INTO settings (key, value) VALUES ('my_name', '他') ON CONFLICT (key) DO NOTHING`;
  await query`INSERT INTO settings (key, value) VALUES ('her_name', '她') ON CONFLICT (key) DO NOTHING`;
  try { await query`CREATE INDEX IF NOT EXISTS idx_memories_date ON memories (date)`; } catch {}
  try { await query`CREATE INDEX IF NOT EXISTS idx_memories_location ON memories (location)`; } catch {}
  try { await query`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at)`; } catch {}
  initialized = true;
  console.log("[initDb] Tables created successfully");
  } catch (e) {
    console.error("[initDb] Failed:", e instanceof Error ? e.message : e);
    throw e;
  }
}

function row<T>(r: Record<string, unknown>): T {
  return r as unknown as T;
}

export interface Memory {
  id: number;
  date: string;
  content: string;
  images: string[];
  tags: string[];
  author: string;
  location: string;
  created_at: string;
}

function parseMemory(r: Record<string, unknown>): Memory {
  const images = typeof r.images === "string" ? r.images : "[]";
  const tags = typeof r.tags === "string" ? r.tags : "[]";
  return {
    id: Number(r.id),
    date: String(r.date),
    content: String(r.content),
    images: JSON.parse(images),
    tags: JSON.parse(tags),
    author: String(r.author),
    location: String(r.location || ""),
    created_at: String(r.created_at),
  };
}

export async function getMemoriesByMonth(year: number, month: number) {
  await initDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rows = await query`SELECT * FROM memories WHERE date >= ${start} AND date < ${end} ORDER BY date DESC`;
  return rows.map(parseMemory);
}

export async function getMemoriesByDate(date: string) {
  await initDb();
  const rows = await query`SELECT * FROM memories WHERE date = ${date} ORDER BY created_at DESC`;
  return rows.map(parseMemory);
}

export async function getAllMemories() {
  await initDb();
  const rows = await query`SELECT * FROM memories ORDER BY date DESC, created_at DESC`;
  return rows.map(parseMemory);
}

export async function getDatesWithMemories(year: number, month: number) {
  await initDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rows = await query`SELECT DISTINCT date FROM memories WHERE date >= ${start} AND date < ${end}`;
  return rows.map((r) => String(r.date));
}

export async function getDatesWithMemoriesByYear(year: number) {
  await initDb();
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const rows = await query`SELECT DISTINCT date FROM memories WHERE date >= ${start} AND date < ${end}`;
  return rows.map((r) => String(r.date));
}

export async function getDateTags(year: number, month: number | null) {
  await initDb();
  if (month) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const rows = await query`SELECT date, tags FROM memories WHERE date >= ${start} AND date < ${end} ORDER BY date`;
    const result: Record<string, string[] | null> = {};
    const tagSet: Record<string, Set<string>> = {};
    for (const row of rows) {
      const d = String(row.date);
      if (!tagSet[d]) tagSet[d] = new Set();
      const tagList: string[] = row.tags ? JSON.parse(row.tags as string) : [];
      for (const t of tagList) tagSet[d].add(t);
    }
    for (const d of Object.keys(tagSet)) {
      result[d] = Array.from(tagSet[d]);
    }
    const final: Record<string, string | null> = {};
    for (const d of Object.keys(result)) {
      final[d] = pickHighestPriorityTag(result[d]!);
    }
    return final;
  }
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const rows = await query`SELECT date, tags FROM memories WHERE date >= ${start} AND date < ${end} ORDER BY date`;
  const result: Record<string, string[] | null> = {};
  const tagSet: Record<string, Set<string>> = {};
  for (const row of rows) {
    const d = String(row.date);
    if (!tagSet[d]) tagSet[d] = new Set();
    const tagList: string[] = row.tags ? JSON.parse(row.tags as string) : [];
    for (const t of tagList) tagSet[d].add(t);
  }
  for (const d of Object.keys(tagSet)) {
    result[d] = Array.from(tagSet[d]);
  }
  const final: Record<string, string | null> = {};
  for (const d of Object.keys(result)) {
    final[d] = pickHighestPriorityTag(result[d]!);
  }
  return final;
}

export async function getMemoriesByLocation(location: string) {
  await initDb();
  const rows = await query`SELECT * FROM memories WHERE location = ${location} ORDER BY date DESC, created_at DESC`;
  return rows.map(parseMemory);
}

export async function getAllLocationsWithMemories() {
  await initDb();
  const rows = await query`SELECT DISTINCT location FROM memories WHERE location != ''`;
  return rows.map((r) => String(r.location));
}

export async function createMemory(data: {
  date: string;
  content: string;
  images: string[];
  tags: string[];
  author: string;
  location: string;
}) {
  await initDb();
  const rows = await query`INSERT INTO memories (date, content, images, tags, author, location)
    VALUES (${data.date}, ${data.content}, ${JSON.stringify(data.images)}, ${JSON.stringify(data.tags)}, ${data.author}, ${data.location})
    RETURNING *`;
  return parseMemory(rows[0]);
}

export async function updateMemory(
  id: number,
  data: { content?: string; images?: string[]; tags?: string[]; author?: string; location?: string }
) {
  await initDb();
  const existing = await query`SELECT * FROM memories WHERE id = ${id}`;
  if (existing.length === 0) return null;
  const row = existing[0];
  const content = data.content ?? String(row.content);
  const images = data.images !== undefined ? JSON.stringify(data.images) : String(row.images);
  const tags = data.tags !== undefined ? JSON.stringify(data.tags) : String(row.tags);
  const author = data.author ?? String(row.author);
  const location = data.location !== undefined ? data.location : String(row.location || "");
  const rows = await query`UPDATE memories SET content=${content}, images=${images}, tags=${tags}, author=${author}, location=${location} WHERE id=${id} RETURNING *`;
  return parseMemory(rows[0]);
}

export async function deleteMemory(id: number) {
  await initDb();
  const result = await query`DELETE FROM memories WHERE id = ${id}`;
  return result.length > 0 || result.length === 0 ? true : false;
}

export async function getRandomMemory() {
  await initDb();
  const rows = await query`SELECT * FROM memories WHERE content != '' ORDER BY RANDOM() LIMIT 1`;
  return rows.length > 0 ? parseMemory(rows[0]) : null;
}

export async function getRandomMemoryByMonthDay(month: number, day: number) {
  await initDb();
  const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const rows = await query`SELECT * FROM memories WHERE SUBSTRING(date FROM 6 FOR 5) = ${monthDay} AND content != '' ORDER BY RANDOM() LIMIT 1`;
  return rows.length > 0 ? parseMemory(rows[0]) : null;
}

export async function getSetting(key: string) {
  await initDb();
  const rows = await query`SELECT value FROM settings WHERE key = ${key}`;
  return rows.length > 0 ? String(rows[0].value) : "";
}

export async function setSetting(key: string, value: string) {
  await initDb();
  await query`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

export interface Message {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

export async function getMessages() {
  await initDb();
  const rows = await query`SELECT * FROM messages ORDER BY created_at DESC`;
  return rows.map((r) => row<Message>(r));
}

export async function createMessage(data: { content: string; author: string }) {
  await initDb();
  const rows = await query`INSERT INTO messages (content, author) VALUES (${data.content}, ${data.author}) RETURNING *`;
  return row<Message>(rows[0]);
}

export async function deleteMessage(id: number) {
  await initDb();
  const result = await query`DELETE FROM messages WHERE id = ${id}`;
  return true;
}

export interface Wish {
  id: number;
  title: string;
  description: string;
  completed: number;
  author: string;
  created_at: string;
}

export async function getWishes() {
  await initDb();
  const rows = await query`SELECT * FROM wishes ORDER BY completed ASC, created_at DESC`;
  return rows.map((r) => row<Wish>(r));
}

export async function createWish(data: { title: string; description: string; author: string }) {
  await initDb();
  const rows = await query`INSERT INTO wishes (title, description, author) VALUES (${data.title}, ${data.description}, ${data.author}) RETURNING *`;
  return row<Wish>(rows[0]);
}

export async function updateWish(
  id: number,
  data: { title?: string; description?: string; completed?: number; author?: string }
) {
  await initDb();
  const existing = await query`SELECT * FROM wishes WHERE id = ${id}`;
  if (existing.length === 0) return null;
  const r = existing[0];
  const rows = await query`UPDATE wishes SET
    title=${data.title ?? String(r.title)},
    description=${data.description ?? String(r.description)},
    completed=${data.completed ?? Number(r.completed)},
    author=${data.author ?? String(r.author)}
    WHERE id=${id} RETURNING *`;
  return row<Wish>(rows[0]);
}

export async function deleteWish(id: number) {
  await initDb();
  await query`DELETE FROM wishes WHERE id = ${id}`;
  return true;
}
