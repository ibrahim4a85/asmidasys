// طبقة بيانات محاكاة (Mock Data) لتشغيل النموذج التفاعلي بدون خادم أو قاعدة بيانات.
// في الإنتاج تُستبدل هذه الطبقة بـ tRPC + MySQL + Object Storage (كما في asmidasys).
// تُحفظ البيانات في localStorage كي تصمد التعديلات بين الجلسات داخل المتصفح.

export interface SystemUser {
  id: number;
  username: string;
  password: string;
  fullName: string;
  userType: string;
  userLevel: "primary" | "secondary";
  branchId: number | null;
  phone: string;
  email: string;
  boardPosition: string;
  isActive: boolean;
  lastLogin: string | null;
  permissions: Record<string, boolean>;
}

export interface Branch {
  id: number;
  name: string;
  regionId: number;
  isActive: boolean;
}

export interface Receipt {
  id: number;
  serialNumber: string;
  branchId: number;
  customerName: string;
  amount: number;
  amountInWords: string;
  paymentMethod: string;
  bank: string;
  paymentFor: string;
  customerStatement: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  status: "issued" | "approved" | "rejected" | "draft";
  createdAt: string;
  notes: string;
}

export interface PerformanceReport {
  id: number;
  branchId: number;
  reportDate: string;
  salesCount: number;
  salesValue: number;
  returnsCount: number;
  returnsValue: number;
  netSales: number;
  receiptsCount: number;
  collections: number;
}

export interface Attachment {
  id: number;
  fileName: string;
  mime: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  kind: string;
  url: string;
}

export const BRANCHES: Branch[] = [
  { id: 1, name: "الرياض", regionId: 1, isActive: true },
  { id: 2, name: "بريدة", regionId: 1, isActive: true },
  { id: 3, name: "الخرج", regionId: 1, isActive: true },
  { id: 4, name: "جدة", regionId: 2, isActive: true },
  { id: 5, name: "وادي الدواسر", regionId: 1, isActive: true },
  { id: 6, name: "تبوك", regionId: 3, isActive: true },
  { id: 7, name: "حائل", regionId: 1, isActive: true },
  { id: 8, name: "الدمام", regionId: 4, isActive: true },
  { id: 9, name: "نجران", regionId: 3, isActive: true },
  { id: 10, name: "الجوف", regionId: 3, isActive: true },
];

export const BRANCH_ORDER = ["الرياض", "بريدة", "الخرج", "جدة", "وادي الدواسر", "تبوك", "حائل", "الدمام", "نجران", "الجوف"];

export const USER_TYPE_DEFINITIONS = [
  { code: "admin", label: "مدير النظام", isActive: true },
  { code: "reviewer", label: "مراجع", isActive: true },
  { code: "authorized_reviewer", label: "مراجع معمد", isActive: true },
  { code: "delegate", label: "مندوب", isActive: true },
  { code: "sales_manager", label: "مدير مبيعات", isActive: true },
  { code: "finance_manager", label: "مدير مالي", isActive: true },
  { code: "authorized_partner", label: "شريك مفوض", isActive: true },
];

export const PAYMENT_METHODS = [
  { id: 1, name: "تحويل بنكي", requiresAttachment: true },
  { id: 2, name: "نقداً", requiresAttachment: false },
  { id: 3, name: "إيداع شبكة", requiresAttachment: true },
  { id: 4, name: "إيداع نقدي", requiresAttachment: true },
  { id: 5, name: "إيداع شيك", requiresAttachment: true },
];

export const BANKS = ["مصرف الراجحي", "البنك الأهلي السعودي", "بنك الرياض", "بنك ساب", "مصرف الإنماء"];

export const PAYMENT_FOR = ["سداد الرصيد", "دفعة من الحساب", "عربون", "دفعة نهائية"];

const defaultAdminPermissions = {
  customersManage: true,
  targetsManage: true,
  receiptsApprove: true,
  dataDelete: true,
  approvalRequest: true,
  approvalDelegate: true,
  partnerRightsView: true,
  partnerRightsManage: true,
  reportsView: true,
  usersManage: true,
};

const defaultDelegatePermissions = {
  customersManage: false,
  targetsManage: false,
  receiptsApprove: false,
  dataDelete: false,
  approvalRequest: true,
  approvalDelegate: false,
  partnerRightsView: false,
  partnerRightsManage: false,
  reportsView: false,
  usersManage: false,
};

const seedUsers: SystemUser[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    fullName: "إبراهيم مقبل",
    userType: "admin",
    userLevel: "primary",
    branchId: null,
    phone: "0500000001",
    email: "admin@company.sa",
    boardPosition: "",
    isActive: true,
    lastLogin: null,
    permissions: defaultAdminPermissions,
  },
  {
    id: 2,
    username: "manger",
    password: "manger123",
    fullName: "أحمد طارق مراد",
    userType: "sales_manager",
    userLevel: "primary",
    branchId: 1,
    phone: "0500000002",
    email: "ahmed@company.sa",
    boardPosition: "عضو مجلس الإدارة",
    isActive: true,
    lastLogin: null,
    permissions: { ...defaultDelegatePermissions, reportsView: true, customersManage: true },
  },
  {
    id: 3,
    username: "delegate1",
    password: "delegate123",
    fullName: "طارق عبدالرحمن مراد",
    userType: "delegate",
    userLevel: "secondary",
    branchId: 4,
    phone: "0500000003",
    email: "tareq@company.sa",
    boardPosition: "",
    isActive: true,
    lastLogin: null,
    permissions: defaultDelegatePermissions,
  },
];

const seedReceipts: Receipt[] = [
  { id: 1, serialNumber: "4-26-001", branchId: 4, customerName: "مؤسسة النخبة الزراعية", amount: 12500, amountInWords: "اثنا عشر ألفاً وخمسمائة ريال سعودي", paymentMethod: "تحويل بنكي", bank: "مصرف الراجحي", paymentFor: "سداد الرصيد", customerStatement: "سداد دفعة من حساب عميل", attachmentUrl: null, attachmentName: null, status: "approved", createdAt: "2026-08-24T09:30:00", notes: "" },
  { id: 2, serialNumber: "4-26-002", branchId: 4, customerName: "شركة الريادة للأسمدة", amount: 8750, amountInWords: "ثمانية آلاف وسبعمائة وخمسون ريالاً سعودياً", paymentMethod: "نقداً", bank: "—", paymentFor: "دفعة من الحساب", customerStatement: "", attachmentUrl: null, attachmentName: null, status: "issued", createdAt: "2026-08-26T11:15:00", notes: "" },
  { id: 3, serialNumber: "1-26-003", branchId: 1, customerName: "مصنع السهول للاسمدة", amount: 22000, amountInWords: "اثنان وعشرون ألف ريال سعودي", paymentMethod: "إيداع شيك", bank: "البنك الأهلي السعودي", paymentFor: "سداد الرصيد", customerStatement: "سداد الرصيد كاملاً", attachmentUrl: null, attachmentName: null, status: "issued", createdAt: "2026-08-27T08:00:00", notes: "" },
  { id: 4, serialNumber: "2-26-001", branchId: 2, customerName: "شركة الرواد الزراعية", amount: 5400, amountInWords: "خمسة آلاف وأربعمائة ريال سعودي", paymentMethod: "نقداً", bank: "—", paymentFor: "دفعة نهائية", customerStatement: "", attachmentUrl: null, attachmentName: null, status: "rejected", createdAt: "2026-08-22T14:20:00", notes: "المبلغ غير مطابق للفاتورة" },
];

const seedReports: PerformanceReport[] = [
  { id: 1, branchId: 1, reportDate: "2026-08-27", salesCount: 12, salesValue: 96000, returnsCount: 1, returnsValue: 3000, netSales: 93000, receiptsCount: 9, collections: 88000 },
  { id: 2, branchId: 4, reportDate: "2026-08-27", salesCount: 9, salesValue: 74000, returnsCount: 0, returnsValue: 0, netSales: 74000, receiptsCount: 7, collections: 69000 },
  { id: 3, branchId: 2, reportDate: "2026-08-27", salesCount: 6, salesValue: 52000, returnsCount: 2, returnsValue: 4100, netSales: 47900, receiptsCount: 5, collections: 46000 },
  { id: 4, branchId: 4, reportDate: "2026-08-26", salesCount: 11, salesValue: 81000, returnsCount: 1, returnsValue: 2200, netSales: 78800, receiptsCount: 8, collections: 77000 },
];

const seedAttachments: Attachment[] = [
  { id: 1, fileName: "كشف_حساب_البنك_08.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 248000, uploadedAt: "2026-08-24T09:31:00", uploadedBy: "إبراهيم مقبل", kind: "مرفق سند قبض", url: "" },
  { id: 2, fileName: "سند_قبض_4-26-001.pdf", mime: "application/pdf", size: 182000, uploadedAt: "2026-08-24T09:35:00", uploadedBy: "إبراهيم مقبل", kind: "مرفق سند قبض", url: "" },
];

const STORAGE_KEY = "asmidasys-prototype-v1";

interface Store {
  users: SystemUser[];
  receipts: Receipt[];
  reports: PerformanceReport[];
  attachments: Attachment[];
  notifications: { id: number; title: string; message: string; createdAt: string; isRead: boolean; type: string }[];
}

function loadStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  const initial: Store = {
    users: seedUsers,
    receipts: seedReceipts,
    reports: seedReports,
    attachments: seedAttachments,
    notifications: [
      { id: 1, title: "طلب تعميد جديد", message: "قام المندوب طارق بإنشاء طلب تعميد RA101-001", createdAt: "2026-08-27T09:00:00", isRead: false, type: "approval" },
      { id: 2, title: "سند قبض بحاجة للاعتماد", message: "سند القبض 4-26-002 بانتظار الاعتماد", createdAt: "2026-08-26T11:16:00", isRead: false, type: "receipt" },
    ],
  };
  return initial;
}

function saveStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export const db = {
  get(): Store {
    return loadStore();
  },
  save(store: Store) {
    saveStore(store);
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
