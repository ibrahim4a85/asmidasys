// اتصال قاعدة البيانات عبر Drizzle ORM.
// - افتراضياً SQLite (ملف محلي) كي تعمل المنصة فوراً دون خادم DB.
// - عند النشر: اضبط DATABASE_URL على MySQL 8 أو PostgreSQL فيعمل نفس الهيكل.
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "erp.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
