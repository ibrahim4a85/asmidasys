// خادم Express — نظام ERP سحابي مترابط (مصادقة جلسات + قاعدة بيانات + رفع ملفات + API).
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { eq, and, desc } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";
import { db, schema } from "./db";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "asmidasys-dev-secret-change-in-production");
const COOKIE = "system_session";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ---------- أدوات ----------
function hash(pw: string) {
  return createHash("sha256").update(pw + "asmidasys-salt").digest("hex");
}
function permissionsOf(u: any): Record<string, boolean> {
  try { return u.permissions ? JSON.parse(u.permissions) : {}; } catch { return {}; }
}
async function sign(userId: number) {
  return new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(JWT_SECRET);
}
async function authUser(req: any, res: any) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, payload.uid as number));
    return rows[0] || null;
  } catch { return null; }
}
function requireAuth(handler: any) {
  return async (req: any, res: any) => {
    const user = await authUser(req, res);
    if (!user) return res.status(401).json({ error: "غير مصرح — سجّل الدخول" });
    req.user = user;
    return handler(req, res, user);
  };
}
const publicUser = (u: any) => ({ id: u.id, username: u.username, fullName: u.fullName, userType: u.userType, userLevel: u.userLevel, branchId: u.branchId, phone: u.phone, email: u.email, boardPosition: u.boardPosition, isActive: Boolean(u.isActive), lastLogin: u.lastLogin, permissions: permissionsOf(u) });

// ---------- رفع الملفات ----------
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, uploadsDir),
    filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.\-\u0600-\u06FF]/g, "_")}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---------- المصادقة ----------
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "أدخل اسم المستخدم وكلمة المرور" });
  const rows = await db.select().from(schema.users).where(eq(schema.users.username, String(username).trim()));
  const user = rows[0];
  if (!user || user.passwordHash !== hash(password)) return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  if (!user.isActive) return res.status(403).json({ error: "الحساب معطّل" });
  await db.update(schema.users).set({ lastLogin: new Date().toISOString() }).where(eq(schema.users.id, user.id));
  const token = await sign(user.id);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", maxAge: 12 * 3600 * 1000 });
  return res.json({ user: publicUser(user) });
});
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ success: true });
});
app.get("/api/auth/me", requireAuth(async (_req, res, user) => res.json({ user: publicUser(user) })));

// ---------- وحدات متكاملة ----------
// فرع
app.get("/api/branches", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.branches).orderBy(schema.branches.id);
  res.json(rows);
}));

// مستخدمون
app.get("/api/users", requireAuth(async (_req, res, user) => {
  if (user.userType !== "admin") return res.status(403).json({ error: "ليس لديك صلاحية" });
  const rows = await db.select().from(schema.users).orderBy(schema.users.id);
  res.json(rows.map(publicUser));
}));
app.post("/api/users", requireAuth(async (req, res, user) => {
  if (user.userType !== "admin") return res.status(403).json({ error: "ليس لديك صلاحية" });
  const { username, password, fullName, userType, userLevel, branchId, phone, email, boardPosition, isActive, permissions } = req.body || {};
  if (!username || !password || !fullName) return res.status(400).json({ error: "يرجى ملء الحقول المطلوبة" });
  const dup = await db.select().from(schema.users).where(eq(schema.users.username, username));
  if (dup.length) return res.status(409).json({ error: "اسم المستخدم مستخدم مسبقاً" });
  const rows = await db.insert(schema.users).values({
    username, passwordHash: hash(password), fullName, userType: userType || "delegate", userLevel: userLevel || "secondary",
    branchId: branchId || null, phone, email, boardPosition, isActive: isActive !== false, permissions: JSON.stringify(permissions || {}),
  }).returning();
  res.json({ user: publicUser(rows[0]) });
}));
app.put("/api/users/:id", requireAuth(async (req, res, user) => {
  if (user.userType !== "admin") return res.status(403).json({ error: "ليس لديك صلاحية" });
  const { password, fullName, userType, userLevel, branchId, phone, email, boardPosition, isActive, permissions } = req.body || {};
  const existing = (await db.select().from(schema.users).where(eq(schema.users.id, Number(req.params.id))))[0];
  if (!existing) return res.status(404).json({ error: "المستخدم غير موجود" });
  const patch: any = { fullName, userType, userLevel, branchId: branchId || null, phone, email, boardPosition, isActive, permissions: JSON.stringify(permissions || {}) };
  if (password && String(password).trim()) patch.passwordHash = hash(password);
  const rows = await db.update(schema.users).set(patch).where(eq(schema.users.id, Number(req.params.id))).returning();
  res.json({ user: publicUser(rows[0]) });
}));
app.delete("/api/users/:id", requireAuth(async (req, res, user) => {
  if (user.userType !== "admin") return res.status(403).json({ error: "ليس لديك صلاحية" });
  if (Number(req.params.id) === user.id) return res.status(400).json({ error: "لا يمكنك حذف حسابك" });
  await db.delete(schema.users).where(eq(schema.users.id, Number(req.params.id)));
  res.json({ success: true });
}));

// عملاء
app.get("/api/customers", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.customers).orderBy(schema.customers.customerNumber);
  res.json(rows);
}));
app.post("/api/customers", requireAuth(async (req, res) => {
  const { customerNumber, name, branchId, phone, email } = req.body || {};
  if (!name || !customerNumber) return res.status(400).json({ error: "أدخل الرقم والاسم" });
  const rows = await db.insert(schema.customers).values({ customerNumber: Number(customerNumber), name, branchId, phone, email }).returning();
  res.json(rows[0]);
}));

// سندات قبض
app.get("/api/receipts", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.receipts).orderBy(desc(schema.receipts.id));
  res.json(rows);
}));
app.post("/api/receipts", requireAuth(async (req, res, user) => {
  const { branchId, customerName, customerId, amount, amountInWords, paymentMethod, bank, paymentFor, customerStatement, attachmentUrl, attachmentName, notes } = req.body || {};
  if (!customerName || !amount || Number(amount) <= 0) return res.status(400).json({ error: "أدخل العميل والمبلغ" });
  const year = new Date().getFullYear().toString().slice(2);
  const all = await db.select().from(schema.receipts);
  const serial = `${branchId}-${year}-${String(all.filter((r) => r.branchId === Number(branchId)).length + 1).padStart(3, "0")}`;
  const rows = await db.insert(schema.receipts).values({
    serialNumber: serial, branchId: Number(branchId), customerId: customerId || null, customerName, amount: Number(amount),
    amountInWords: amountInWords || "مبلغ كتابةً عربياً", paymentMethod, bank, paymentFor, customerStatement, attachmentUrl, attachmentName, notes, createdById: user.id, status: "issued",
  }).returning();
  // إشعار للمدير عند الإصدار
  const admins = await db.select().from(schema.users).where(eq(schema.users.userType, "admin"));
  for (const a of admins) await db.insert(schema.notifications).values({ recipientUserId: a.id, type: "receipt", title: "سند قبض جديد", message: `تم إصدار سند القبض ${serial}` });
  res.json(rows[0]);
}));
app.post("/api/receipts/:id/decide", requireAuth(async (req, res) => {
  const { status } = req.body || {};
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "حالة غير صالحة" });
  const rows = await db.update(schema.receipts).set({ status }).where(eq(schema.receipts.id, Number(req.params.id))).returning();
  res.json(rows[0]);
}));

// سندات صرف
app.get("/api/payments", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.payments).orderBy(desc(schema.payments.id));
  res.json(rows);
}));
app.post("/api/payments", requireAuth(async (req, res) => {
  const { branchId, beneficiary, amount, expenseCategory, paymentMethod, bank, description, attachmentUrl } = req.body || {};
  if (!beneficiary || !amount) return res.status(400).json({ error: "أدخل المستفيد والمبلغ" });
  const all = await db.select().from(schema.payments);
  const serial = `PY-${String(branchId || 1)}-${String(all.length + 1).padStart(3, "0")}`;
  const rows = await db.insert(schema.payments).values({ serialNumber: serial, branchId: branchId || null, beneficiary, amount: Number(amount), expenseCategory, paymentMethod, bank, description, attachmentUrl }).returning();
  res.json(rows[0]);
}));

// تقارير الأداء
app.get("/api/performance-reports", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.performanceReports).orderBy(desc(schema.performanceReports.reportDate));
  res.json(rows);
}));
app.post("/api/performance-reports", requireAuth(async (req, res) => {
  const { branchId, reportDate, salesCount, salesValue, returnsCount, returnsValue, receiptsCount, collections } = req.body || {};
  if (!reportDate) return res.status(400).json({ error: "أدخل التاريخ" });
  const dup = await db.select().from(schema.performanceReports).where(and(eq(schema.performanceReports.branchId, Number(branchId)), eq(schema.performanceReports.reportDate, reportDate)));
  if (dup.length) return res.status(409).json({ error: "يوجد سجل مكرر لهذا الفرع في اليوم المحدد" });
  const net = (Number(salesValue) || 0) - (Number(returnsValue) || 0);
  const rows = await db.insert(schema.performanceReports).values({ branchId: Number(branchId), reportDate, salesCount: Number(salesCount) || 0, salesValue: Number(salesValue) || 0, returnsCount: Number(returnsCount) || 0, returnsValue: Number(returnsValue) || 0, netSales: net, receiptsCount: Number(receiptsCount) || 0, collections: Number(collections) || 0 }).returning();
  res.json(rows[0]);
}));

// أهداف
app.get("/api/targets", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.targets).orderBy(desc(schema.targets.id));
  res.json(rows);
}));
app.post("/api/targets", requireAuth(async (req, res) => {
  const { branchId, type, targetValue, year } = req.body || {};
  if (!targetValue) return res.status(400).json({ error: "أدخل القيمة المستهدفة" });
  const rows = await db.insert(schema.targets).values({ branchId: Number(branchId), type, targetValue: Number(targetValue), year: year || new Date().getFullYear() }).returning();
  res.json(rows[0]);
}));

// تعميدات
app.get("/api/delegations", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.delegations).orderBy(desc(schema.delegations.id));
  res.json(rows);
}));
app.post("/api/delegations", requireAuth(async (req, res) => {
  const { type, applicantName, attachmentUrl, attachmentName } = req.body || {};
  if (!applicantName) return res.status(400).json({ error: "أدخل اسم مقدم الطلب" });
  const all = await db.select().from(schema.delegations);
  const number = `RA101-${String(all.length + 1).padStart(3, "0")}`;
  const rows = await db.insert(schema.delegations).values({ requestNumber: number, type, applicantName, attachmentUrl, attachmentName }).returning();
  res.json(rows[0]);
}));

// شركاء
app.get("/api/partners", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.partners).orderBy(schema.partners.id);
  res.json(rows);
}));

// إشعارات
app.get("/api/notifications", requireAuth(async (_req, res, user) => {
  const rows = await db.select().from(schema.notifications).where(eq(schema.notifications.recipientUserId, user.id)).orderBy(desc(schema.notifications.id));
  res.json(rows);
}));
app.post("/api/notifications/read-all", requireAuth(async (_req, res, user) => {
  await db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.recipientUserId, user.id));
  res.json({ success: true });
}));

// مرفقات (عرض الملفات المرفوعة)
app.get("/api/attachments", requireAuth(async (_req, res) => {
  const rows = await db.select().from(schema.attachments).orderBy(desc(schema.attachments.id));
  res.json(rows.map((a) => ({ ...a, url: `/uploads/${path.basename(a.path)}` })));
}));

// رفع ملف (نقطة عامة تُستخدم من الواجهات بعد التحقق من الجلسة)
app.post("/api/upload", requireAuth(async (req, res, user) => {
  upload.single("file")(req, res, async (err: any) => {
    if (err) return res.status(400).json({ error: "تعذّر رفع الملف: " + err.message });
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "لم يتم اختيار ملف" });
    const rows = await db.insert(schema.attachments).values({
      fileName: file.originalname, mime: file.mimetype, size: file.size, kind: req.body.kind || "عام", path: file.path, uploadedById: user.id,
    }).returning();
    res.json({ id: rows[0].id, fileName: rows[0].fileName, url: `/uploads/${path.basename(rows[0].path)}` });
  });
}));

// ملفات مرفوعة
app.use("/uploads", express.static(uploadsDir));

// ---------- خدمة الواجهة المبنية في الإنتاج ----------
const dist = path.resolve(process.cwd(), "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ خادم ERP يعمل على http://0.0.0.0:${PORT}`);
});
