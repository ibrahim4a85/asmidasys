// تهيئة قاعدة البيانات ببيانات مرجعية غير إنتاجية (إعداد أولي).
import { db, schema } from "./db";
import { createHash } from "node:crypto";

function hash(password: string) {
  return createHash("sha256").update(password + "asmidasys-salt").digest("hex");
}

async function seed() {
  // الفروع بالترتيب المرجعي
  const branchNames = ["الرياض", "بريدة", "الخرج", "جدة", "وادي الدواسر", "تبوك", "حائل", "الدمام", "نجران", "الجوف"];
  const branchRows = await db.select().from(schema.branches);
  if (branchRows.length === 0) {
    for (const [i, name] of branchNames.entries()) {
      await db.insert(schema.branches).values({ name, region: "المملكة" });
    }
  }

  // أنواع المستخدمين
  const types = [
    ["admin", "مدير النظام"],
    ["reviewer", "مراجع"],
    ["authorized_reviewer", "مراجع معمد"],
    ["delegate", "مندوب"],
    ["sales_manager", "مدير مبيعات"],
    ["finance_manager", "مدير مالي"],
    ["authorized_partner", "شريك مفوض"],
  ];
  const existingTypes = await db.select().from(schema.userTypes);
  if (existingTypes.length === 0) {
    for (const [code, label] of types) await db.insert(schema.userTypes).values({ code, label });
  }

  // المستخدمون
  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length === 0) {
    await db.insert(schema.users).values([
      {
        username: "admin", passwordHash: hash("admin123"), fullName: "إبراهيم مقبل",
        userType: "admin", userLevel: "primary", isActive: true,
        permissions: JSON.stringify({ usersManage: true, receiptsApprove: true, customersManage: true, targetsManage: true, dataDelete: true, approvalRequest: true, approvalDelegate: true, partnerRightsView: true, partnerRightsManage: true, reportsView: true }),
      },
      {
        username: "manger", passwordHash: hash("manger123"), fullName: "أحمد طارق مراد",
        userType: "sales_manager", userLevel: "primary", branchId: 1, isActive: true,
        permissions: JSON.stringify({ reportsView: true, customersManage: true }),
      },
      {
        username: "delegate1", passwordHash: hash("delegate123"), fullName: "طارق عبدالرحمن مراد",
        userType: "delegate", userLevel: "secondary", branchId: 4, isActive: true, permissions: "{}",
      },
    ]);
  }

  // العملاء
  const existingCustomers = await db.select().from(schema.customers);
  if (existingCustomers.length === 0) {
    const c = [
      [1001, "مؤسسة النخبة الزراعية", 1, "0551112223"],
      [1002, "شركة الريادة للأسمدة", 4, "0552223334"],
      [1003, "مصنع السهول للاسمدة", 1, "0553334445"],
      [1004, "شركة الرواد الزراعية", 2, "0554445556"],
    ];
    for (const [num, name, branch, phone] of c) {
      await db.insert(schema.customers).values({ customerNumber: num as number, name: name as string, branchId: branch as number, phone: phone as string });
    }
  }

  // الشركاء
  const existingPartners = await db.select().from(schema.partners);
  if (existingPartners.length === 0) {
    const names = ["طارق عبدالرحمن مراد", "أحمد طارق عبدالرحمن مراد", "مروان طارق عبدالرحمن مراد", "ميساء طارق عبدالرحمن مراد"];
    for (const n of names) await db.insert(schema.partners).values({ name: n, sharePercent: 25, openingBalance: 125000 });
  }

  // تقارير أداء تجريبية
  const existingReports = await db.select().from(schema.performanceReports);
  if (existingReports.length === 0) {
    const rows = [
      [1, "2026-08-27", 12, 96000, 1, 3000, 93000, 9, 88000],
      [4, "2026-08-27", 9, 74000, 0, 0, 74000, 7, 69000],
      [2, "2026-08-27", 6, 52000, 2, 4100, 47900, 5, 46000],
      [4, "2026-08-26", 11, 81000, 1, 2200, 78800, 8, 77000],
    ];
    for (const [b, d, sc, sv, rc, rv, ns, rc2, col] of rows) {
      await db.insert(schema.performanceReports).values({ branchId: b as number, reportDate: d as string, salesCount: sc as number, salesValue: sv as number, returnsCount: rc as number, returnsValue: rv as number, netSales: ns as number, receiptsCount: rc2 as number, collections: col as number });
    }
  }

  console.log("✓ تم تهيئة قاعدة البيانات ببيانات مرجعية");
}

seed().catch((e) => {
  console.error("فشل التهيئة:", e);
  process.exit(1);
});
