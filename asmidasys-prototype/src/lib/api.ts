// عميل API — يتصل بخادم Express الحقيقي (نفس الأصل عبر بروكسي Vite في التطوير،
// ونفس الخادم في الإنتاج). مصادقة عبر جلسة cookie آمنة (httpOnly).
const BASE = "";

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as any).error || "حدث خطأ في الاتصال بالخادم") as any;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: any }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: any }>("/api/auth/me"),

  branches: () => request<any[]>("/api/branches"),
  users: () => request<any[]>("/api/users"),
  createUser: (data: any) => request("/api/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/api/users/${id}`, { method: "DELETE" }),

  customers: () => request<any[]>("/api/customers"),
  createCustomer: (data: any) => request("/api/customers", { method: "POST", body: JSON.stringify(data) }),

  receipts: () => request<any[]>("/api/receipts"),
  createReceipt: (data: any) => request("/api/receipts", { method: "POST", body: JSON.stringify(data) }),
  decideReceipt: (id: number, status: string) => request(`/api/receipts/${id}/decide`, { method: "POST", body: JSON.stringify({ status }) }),

  payments: () => request<any[]>("/api/payments"),
  createPayment: (data: any) => request("/api/payments", { method: "POST", body: JSON.stringify(data) }),

  performanceReports: () => request<any[]>("/api/performance-reports"),
  createPerformanceReport: (data: any) => request("/api/performance-reports", { method: "POST", body: JSON.stringify(data) }),

  targets: () => request<any[]>("/api/targets"),
  createTarget: (data: any) => request("/api/targets", { method: "POST", body: JSON.stringify(data) }),

  delegations: () => request<any[]>("/api/delegations"),
  createDelegation: (data: any) => request("/api/delegations", { method: "POST", body: JSON.stringify(data) }),

  partners: () => request<any[]>("/api/partners"),

  notifications: () => request<any[]>("/api/notifications"),
  readAllNotifications: () => request("/api/notifications/read-all", { method: "POST" }),

  attachments: () => request<any[]>("/api/attachments"),

  async upload(file: File, kind: string): Promise<{ id: number; fileName: string; url: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await fetch(BASE + "/api/upload", { method: "POST", credentials: "include", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "تعذّر رفع الملف");
    return data;
  },
};
