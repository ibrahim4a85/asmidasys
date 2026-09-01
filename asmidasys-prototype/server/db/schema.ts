// مخطط قاعدة البيانات (Drizzle ORM) — نظام ERP سحابي مترابط بأسلوب دفترة.
// يُكتب الهيكل مرة واحدة ويعمل على SQLite (للتفعيل فوراً) أو MySQL 8 / PostgreSQL
// في بيئة الإنتاج عبر متغير بيئة DATABASE_URL دون إعادة كتابة الشيفرة.
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------- التنظيم والفروع ----------
export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  region: text("region").notNull().default("الرياض"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- أنواع المستخدمين ----------
export const userTypes = sqliteTable("user_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ---------- المستخدمون (متعددون) ----------
export const users = sqliteTable("system_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  userType: text("user_type").notNull().default("delegate"),
  userLevel: text("user_level").notNull().default("secondary"),
  branchId: integer("branch_id").references(() => branches.id),
  phone: text("phone"),
  email: text("email"),
  boardPosition: text("board_position"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  permissions: text("permissions").notNull().default("{}"), // JSON
  lastLogin: text("last_login"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- العملاء ----------
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerNumber: integer("customer_number").notNull().unique(),
  name: text("name").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  phone: text("phone"),
  email: text("email"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- سندات القبض ----------
export const receipts = sqliteTable("receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serialNumber: text("serial_number").notNull().unique(),
  branchId: integer("branch_id").references(() => branches.id),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  amount: real("amount").notNull(),
  amountInWords: text("amount_in_words"),
  paymentMethod: text("payment_method").notNull(),
  bank: text("bank"),
  paymentFor: text("payment_for"),
  customerStatement: text("customer_statement"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  status: text("status").notNull().default("issued"), // draft | issued | approved | rejected
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- سندات الصرف ----------
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serialNumber: text("serial_number").notNull().unique(),
  branchId: integer("branch_id").references(() => branches.id),
  beneficiary: text("beneficiary").notNull(),
  amount: real("amount").notNull(),
  expenseCategory: text("expense_category"),
  paymentMethod: text("payment_method"),
  bank: text("bank"),
  description: text("description"),
  attachmentUrl: text("attachment_url"),
  status: text("status").notNull().default("issued"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- تقارير الأداء ----------
export const performanceReports = sqliteTable("performance_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").references(() => branches.id),
  reportDate: text("report_date").notNull(),
  salesCount: integer("sales_count").notNull().default(0),
  salesValue: real("sales_value").notNull().default(0),
  returnsCount: integer("returns_count").notNull().default(0),
  returnsValue: real("returns_value").notNull().default(0),
  netSales: real("net_sales").notNull().default(0),
  receiptsCount: integer("receipts_count").notNull().default(0),
  collections: real("collections").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- الأهداف ----------
export const targets = sqliteTable("targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").references(() => branches.id),
  type: text("type").notNull(), // مبيعات | متحصلات | هدف مخصص
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  year: integer("year").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- المرفقات (إرفاق ملفات) ----------
export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  kind: text("kind").notNull().default("عام"), // مرفق سند قبض | صرف | تعميد ...
  path: text("path").notNull(), // مسار الملف (Local أو S3 key)
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  uploadedAt: text("uploaded_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- الإشعارات ----------
export const notifications = sqliteTable("internal_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientUserId: integer("recipient_user_id").references(() => users.id),
  type: text("type").notNull().default("system"),
  title: text("title").notNull(),
  message: text("message"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- الإعدادات ----------
export const settings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------- التعميدات ----------
export const delegations = sqliteTable("delegations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestNumber: text("request_number").notNull().unique(),
  type: text("type").notNull(),
  applicantName: text("applicant_name").notNull(),
  status: text("status").notNull().default("تم الإرسال"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ---------- حقوق الشركاء ----------
export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sharePercent: real("share_percent").notNull(),
  openingBalance: real("opening_balance").notNull().default(0),
  isAuthorized: integer("is_authorized", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const partnerEntries = sqliteTable("partner_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id").references(() => partners.id),
  statement: text("statement"),
  amount: real("amount").notNull(),
  direction: text("direction").notNull(), // withdrawal | accrual | settlement
  attachmentUrl: text("attachment_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type PerformanceReport = typeof performanceReports.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
