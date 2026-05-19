import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:love.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

async function initDb() {
  if (initialized) return;
  await db.batch([
    `CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', '')`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('my_name', '我')`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('her_name', '她')`,
  ]);
  initialized = true;
}

export interface Memory {
  id: number;
  date: string;
  content: string;
  images: string[];
  tags: string[];
  author: string;
  created_at: string;
}

function parseMemory(row: Record<string, unknown>): Memory {
  const images = typeof row.images === "string" ? row.images : "[]";
  const tags = typeof row.tags === "string" ? row.tags : "[]";
  return {
    id: Number(row.id),
    date: String(row.date),
    content: String(row.content),
    images: JSON.parse(images),
    tags: JSON.parse(tags),
    author: String(row.author),
    created_at: String(row.created_at),
  };
}

export async function getMemoriesByMonth(year: number, month: number) {
  await initDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rs = await db.execute({
    sql: "SELECT * FROM memories WHERE date >= ? AND date < ? ORDER BY date DESC",
    args: [start, end],
  });
  return rs.rows.map(parseMemory);
}

export async function getMemoriesByDate(date: string) {
  await initDb();
  const rs = await db.execute({
    sql: "SELECT * FROM memories WHERE date = ? ORDER BY created_at DESC",
    args: [date],
  });
  return rs.rows.map(parseMemory);
}

export async function getAllMemories() {
  await initDb();
  const rs = await db.execute("SELECT * FROM memories ORDER BY date DESC, created_at DESC");
  return rs.rows.map(parseMemory);
}

export async function getDatesWithMemories(year: number, month: number) {
  await initDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rs = await db.execute({
    sql: "SELECT DISTINCT date FROM memories WHERE date >= ? AND date < ?",
    args: [start, end],
  });
  return rs.rows.map((r) => String(r.date));
}

export async function createMemory(data: {
  date: string;
  content: string;
  images: string[];
  tags: string[];
  author: string;
}) {
  await initDb();
  const rs = await db.execute({
    sql: "INSERT INTO memories (date, content, images, tags, author) VALUES (?, ?, ?, ?, ?) RETURNING *",
    args: [data.date, data.content, JSON.stringify(data.images), JSON.stringify(data.tags), data.author],
  });
  return parseMemory(rs.rows[0]);
}

export async function updateMemory(
  id: number,
  data: { content?: string; images?: string[]; tags?: string[]; author?: string }
) {
  await initDb();
  const existing = await db.execute({ sql: "SELECT * FROM memories WHERE id = ?", args: [id] });
  if (existing.rows.length === 0) return null;
  const row = existing.rows[0];
  const content = data.content ?? String(row.content);
  const images = data.images !== undefined ? JSON.stringify(data.images) : String(row.images);
  const tags = data.tags !== undefined ? JSON.stringify(data.tags) : String(row.tags);
  const author = data.author ?? String(row.author);
  const rs = await db.execute({
    sql: "UPDATE memories SET content=?, images=?, tags=?, author=? WHERE id=? RETURNING *",
    args: [content, images, tags, author, id],
  });
  return parseMemory(rs.rows[0]);
}

export async function deleteMemory(id: number) {
  await initDb();
  const rs = await db.execute({ sql: "DELETE FROM memories WHERE id = ?", args: [id] });
  return rs.rowsAffected > 0;
}

export async function getRandomMemory() {
  await initDb();
  const rs = await db.execute("SELECT * FROM memories WHERE content != '' ORDER BY RANDOM() LIMIT 1");
  return rs.rows.length > 0 ? parseMemory(rs.rows[0]) : null;
}

export async function getRandomMemoryByMonthDay(month: number, day: number) {
  await initDb();
  const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const rs = await db.execute({
    sql: "SELECT * FROM memories WHERE substr(date, 6, 5) = ? AND content != '' ORDER BY RANDOM() LIMIT 1",
    args: [monthDay],
  });
  return rs.rows.length > 0 ? parseMemory(rs.rows[0]) : null;
}

export async function getSetting(key: string) {
  await initDb();
  const rs = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [key] });
  return rs.rows.length > 0 ? String(rs.rows[0].value) : "";
}

export async function setSetting(key: string, value: string) {
  await initDb();
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    args: [key, value],
  });
}

export interface Message {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

export async function getMessages() {
  await initDb();
  const rs = await db.execute("SELECT * FROM messages ORDER BY created_at DESC");
  return rs.rows.map((r) => ({
    id: Number(r.id),
    content: String(r.content),
    author: String(r.author),
    created_at: String(r.created_at),
  }));
}

export async function createMessage(data: { content: string; author: string }) {
  await initDb();
  const rs = await db.execute({
    sql: "INSERT INTO messages (content, author) VALUES (?, ?) RETURNING *",
    args: [data.content, data.author],
  });
  return {
    id: Number(rs.rows[0].id),
    content: String(rs.rows[0].content),
    author: String(rs.rows[0].author),
    created_at: String(rs.rows[0].created_at),
  };
}

export async function deleteMessage(id: number) {
  await initDb();
  const rs = await db.execute({ sql: "DELETE FROM messages WHERE id = ?", args: [id] });
  return rs.rowsAffected > 0;
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
  const rs = await db.execute("SELECT * FROM wishes ORDER BY completed ASC, created_at DESC");
  return rs.rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    description: String(r.description),
    completed: Number(r.completed),
    author: String(r.author),
    created_at: String(r.created_at),
  }));
}

export async function createWish(data: { title: string; description: string; author: string }) {
  await initDb();
  const rs = await db.execute({
    sql: "INSERT INTO wishes (title, description, author) VALUES (?, ?, ?) RETURNING *",
    args: [data.title, data.description, data.author],
  });
  return {
    id: Number(rs.rows[0].id),
    title: String(rs.rows[0].title),
    description: String(rs.rows[0].description),
    completed: Number(rs.rows[0].completed),
    author: String(rs.rows[0].author),
    created_at: String(rs.rows[0].created_at),
  };
}

export async function updateWish(
  id: number,
  data: { title?: string; description?: string; completed?: number; author?: string }
) {
  await initDb();
  const existing = await db.execute({ sql: "SELECT * FROM wishes WHERE id = ?", args: [id] });
  if (existing.rows.length === 0) return null;
  const row = existing.rows[0];
  const title = data.title ?? String(row.title);
  const description = data.description ?? String(row.description);
  const completed = data.completed ?? Number(row.completed);
  const author = data.author ?? String(row.author);
  const rs = await db.execute({
    sql: "UPDATE wishes SET title=?, description=?, completed=?, author=? WHERE id=? RETURNING *",
    args: [title, description, completed, author, id],
  });
  return {
    id: Number(rs.rows[0].id),
    title: String(rs.rows[0].title),
    description: String(rs.rows[0].description),
    completed: Number(rs.rows[0].completed),
    author: String(rs.rows[0].author),
    created_at: String(rs.rows[0].created_at),
  };
}

export async function deleteWish(id: number) {
  await initDb();
  const rs = await db.execute({ sql: "DELETE FROM wishes WHERE id = ?", args: [id] });
  return rs.rowsAffected > 0;
}
