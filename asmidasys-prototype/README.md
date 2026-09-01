# منصة شركة الأسمدة المتحدة السعودية — نظام ERP سحابي مترابط (أسلوب دفترة)

منصة **ERP سحابية متكاملة ومترابطة** بأسلوب نظام **دفترة** السحابي: مستخدمون متعددون وصلاحيات دقيقة،
إرفاق ملفات، عرض تقارير، سندات قبض/صرف، عملاء، فروع، أهداف، تعميدات، وحقوق شركاء — كلها متصلة
بقاعدة بيانات واحدة. مطابقة لهوية مشروع **asmidasys** (React 19 + Tailwind + shadcn + RTL، خط Cairo،
لوحة ألوان OKLCH، قائمة ERP جانبية قابلة للسحب).

## المعمارية (Daftra-style / Cloud ERP)

| الطبقة | التقنية |
|---|---|
| الواجهة | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/Radix |
| الخادم | Node.js + Express (REST) + جلسات JWT عبر cookie آمن |
| قاعدة البيانات | **Drizzle ORM** — يعمل الآن على **SQLite**، وينتقل إلى **MySQL 8 / PostgreSQL** دون إعادة كتابة |
| رفع الملفات | Multer → مجلد `uploads/` (محلي) أو Object Storage (S3) عند النشر |
| النشر | Docker / docker-compose + استضافة VPS + دومين خاص |

## الوحدات المترابطة (كلها متصلة بقاعدة البيانات)

- **المستخدمون والصلاحيات**: مستخدمون متعددون، أنواع مستخدمين، مستوى رئيسي/فرعي، ربط بالفرع، صلاحيات دقيقة.
- **إرفاق الملفات**: رفع حقيقي للملفات عبر `/api/upload`، مع فرض المرفق لطرق الدفع التي تتطلب إيصال تحويل.
- **التقارير**: متحصلات بنكية بفلاتر، أداء الفروع، رسوم بيانية، وتقارير أداء يومية مع منع السجل المكرر.
- **سندات القبض**: إصدار مع ترقيم تلقائي حسب الفرع والسنة، اعتماد/رفض، معاينة، وإشعارات تلقائية.
- **سندات الصرف / العملاء / الأهداف / التعميدات / حقوق الشركاء / الإشعارات / الإعدادات** — جميعها
  تقرأ وتكتب في نفس قاعدة البيانات (لا بيانات ثابتة في الواجهة).

## التشغيل

```bash
cd asmidasys-prototype
npm install
# أنشئ قاعدة البيانات واملأها ببيانات مرجعية:
npm run db:push     # إنشاء الجداول (drizzle-kit push)
npm run db:seed     # بيانات مرجعية
npm run dev         # يعمل Vite (5173) + Express (3001) معاً
```

الواجهة على http://localhost:5173 والخادم على http://localhost:3001 (بروكسي Vite يوجّه `/api` و`/uploads`).

### حسابات تجريبية
| المستخدم | كلمة المرور | النوع |
|----------|--------------|-------|
| `admin`  | `admin123`   | مدير النظام |
| `manger` | `manger123`  | مدير مبيعات |
| `delegate1` | `delegate123` | مندوب |

## الانتقال إلى قاعدة بيانات إنتاج (MySQL 8 — مثل asmidasys)

الهيكل مكتوب بـ Drizzle مرة واحدة. لتشغيله على MySQL 8 في استضافتك:

1. أنشئ قاعدة بيانات MySQL (مثل `erp_db`) على لوحة التحكم (cPanel/DirectAdmin).
2. اضبط `DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/erp_db` في `.env`.
3. شغّل `npm run db:push` لإنشاء الجداول على MySQL.
4. شغّل `npm run build` ثم `npm start` (أو انشر عبر Docker).

> ملاحظة: `better-sqlite3` يستخدم متغير `DATABASE_URL` للاختيار. عند الاستضافة، غيّر `server/db/index.ts`
> لاستخدام مزوّد `drizzle-orm/mysql2` أو `postgres` وفق القاعدة المختارة (متوفر في `drizzle-orm`).

## النشر على دومين خاص واستضافة

### الخيار 1 — Docker (VPS، بضغطة واحدة)
```bash
docker compose up -d
# ثم اربط الدومين عبر Nginx/Caddy + SSL إلى منفذ 3001
```

### الخيار 2 — استضافة VPS عادية
```bash
npm run build && npm run build:server
NODE_ENV=production SESSION_SECRET=... DATABASE_URL=... node dist-server/index.js
```
ثم أضف عكس وكيل Nginx:
```
server {
  server_name your-domain.com;
  location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; }
  location /api/ { proxy_pass http://127.0.0.1:3001; }
  location /uploads/ { proxy_pass http://127.0.0.1:3001; }
}
```

## المتغيرات البيئية
انظر `.env.example` — `PORT`, `SESSION_SECRET`, `DATABASE_URL`, وإعدادات S3 عند الحاجة.

## بنية المشروع
```
server/
  db/schema.ts      # مخطط قاعدة البيانات (Drizzle)
  db/index.ts       # اتصال القاعدة
  seed.ts           # بيانات مرجعية
  index.ts          # خادم Express + مصادقة + رفع ملفات + API
src/
  lib/api.ts        # عميل API
  lib/mockData.ts   # ثوابت الواجهة (فروع، طرق دفع...)
  contexts/         # Auth + Theme
  components/       # AppLayout (القشرة) + FileDropzone + ...
  pages/            # الشاشات
```
