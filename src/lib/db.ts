import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "love.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('start_date', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('my_name', '我');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('her_name', '她');

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      author TEXT NOT NULL DEFAULT '我',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

export interface Message {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

export function getMessages(): Message[] {
  return getDb()
    .prepare("SELECT * FROM messages ORDER BY created_at DESC")
    .all() as Message[];
}

export function createMessage(data: { content: string; author: string }): Message {
  const result = getDb()
    .prepare("INSERT INTO messages (content, author) VALUES (?, ?)")
    .run(data.content, data.author);
  return getDb()
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(result.lastInsertRowid) as Message;
}

export function deleteMessage(id: number): boolean {
  const result = getDb().prepare("DELETE FROM messages WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface Wish {
  id: number;
  title: string;
  description: string;
  completed: number;
  author: string;
  created_at: string;
}

export function getWishes(): Wish[] {
  return getDb()
    .prepare("SELECT * FROM wishes ORDER BY completed ASC, created_at DESC")
    .all() as Wish[];
}

export function createWish(data: { title: string; description: string; author: string }): Wish {
  const result = getDb()
    .prepare("INSERT INTO wishes (title, description, author) VALUES (?, ?, ?)")
    .run(data.title, data.description, data.author);
  return getDb()
    .prepare("SELECT * FROM wishes WHERE id = ?")
    .get(result.lastInsertRowid) as Wish;
}

export function updateWish(id: number, data: { title?: string; description?: string; completed?: number; author?: string }): Wish | null {
  const existing = getDb().prepare("SELECT * FROM wishes WHERE id = ?").get(id) as Wish | undefined;
  if (!existing) return null;
  getDb()
    .prepare("UPDATE wishes SET title=?, description=?, completed=?, author=? WHERE id=?")
    .run(
      data.title ?? existing.title,
      data.description ?? existing.description,
      data.completed ?? existing.completed,
      data.author ?? existing.author,
      id
    );
  return getDb().prepare("SELECT * FROM wishes WHERE id = ?").get(id) as Wish;
}

export function deleteWish(id: number): boolean {
  const result = getDb().prepare("DELETE FROM wishes WHERE id = ?").run(id);
  return result.changes > 0;
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

export interface MemoryRow {
  id: number;
  date: string;
  content: string;
  images: string;
  tags: string;
  author: string;
  created_at: string;
}

export function rowToMemory(row: MemoryRow): Memory {
  return {
    ...row,
    images: JSON.parse(row.images || "[]"),
    tags: JSON.parse(row.tags || "[]"),
  };
}

export function getMemoriesByMonth(year: number, month: number): Memory[] {
  const d = getDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const rows = d
    .prepare("SELECT * FROM memories WHERE date >= ? AND date < ? ORDER BY date DESC")
    .all(start, end) as MemoryRow[];

  return rows.map(rowToMemory);
}

export function getMemoriesByDate(date: string): Memory[] {
  const rows = getDb()
    .prepare("SELECT * FROM memories WHERE date = ? ORDER BY created_at DESC")
    .all(date) as MemoryRow[];
  return rows.map(rowToMemory);
}

export function getAllMemories(): Memory[] {
  const rows = getDb()
    .prepare("SELECT * FROM memories ORDER BY date DESC, created_at DESC")
    .all() as MemoryRow[];
  return rows.map(rowToMemory);
}

export function getDatesWithMemories(year: number, month: number): string[] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const rows = getDb()
    .prepare("SELECT DISTINCT date FROM memories WHERE date >= ? AND date < ?")
    .all(start, end) as { date: string }[];

  return rows.map((r) => r.date);
}

export function createMemory(data: {
  date: string;
  content: string;
  images: string[];
  tags: string[];
  author: string;
}): Memory {
  const result = getDb()
    .prepare(
      "INSERT INTO memories (date, content, images, tags, author) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      data.date,
      data.content,
      JSON.stringify(data.images),
      JSON.stringify(data.tags),
      data.author
    );

  const row = getDb()
    .prepare("SELECT * FROM memories WHERE id = ?")
    .get(result.lastInsertRowid) as MemoryRow;
  return rowToMemory(row);
}

export function updateMemory(
  id: number,
  data: { content?: string; images?: string[]; tags?: string[]; author?: string }
): Memory | null {
  const existing = getDb()
    .prepare("SELECT * FROM memories WHERE id = ?")
    .get(id) as MemoryRow | undefined;
  if (!existing) return null;

  const content = data.content ?? existing.content;
  const images =
    data.images !== undefined ? JSON.stringify(data.images) : existing.images;
  const tags = data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags;
  const author = data.author ?? existing.author;

  getDb()
    .prepare("UPDATE memories SET content=?, images=?, tags=?, author=? WHERE id=?")
    .run(content, images, tags, author, id);

  const row = getDb()
    .prepare("SELECT * FROM memories WHERE id = ?")
    .get(id) as MemoryRow;
  return rowToMemory(row);
}

export function deleteMemory(id: number): boolean {
  const result = getDb().prepare("DELETE FROM memories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getRandomMemory(): Memory | null {
  const row = getDb()
    .prepare("SELECT * FROM memories WHERE content != '' ORDER BY RANDOM() LIMIT 1")
    .get() as MemoryRow | undefined;
  return row ? rowToMemory(row) : null;
}

export function getRandomMemoryByMonthDay(month: number, day: number): Memory | null {
  const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const row = getDb()
    .prepare(
      "SELECT * FROM memories WHERE substr(date, 6, 5) = ? AND content != '' ORDER BY RANDOM() LIMIT 1"
    )
    .get(monthDay) as MemoryRow | undefined;
  return row ? rowToMemory(row) : null;
}

export function getSetting(key: string): string {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? "";
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(key, value);
}
