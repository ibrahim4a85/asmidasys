import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletCards, Receipt, Users, TrendingUp, FilePlus2, BarChart3, Paperclip } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useSystemAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, isAdmin } = useSystemAuth();
  const [, setLocation] = useLocation();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.receipts(), api.performanceReports(), api.users()])
      .then(([r, rep, u]) => { setReceipts(r); setReports(rep); setUsers(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approved = receipts.filter((r) => r.status === "approved");
  const approvedCollections = approved.reduce((s: number, r) => s + r.amount, 0);
  const branchData = BRANCHES.map((b) => {
    const val = receipts.filter((r) => r.branchId === b.id).reduce((s, r) => s + r.amount, 0);
    return { name: b.name, collections: val };
  });
  const salesData = reports
    .slice()
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
    .map((r) => ({ date: r.reportDate.slice(5), مبيعات: r.salesValue, متحصلات: r.collections }));

  const shortcuts = [
    { label: "إصدار سند قبض", icon: FilePlus2, path: "/receipts", color: "text-primary bg-primary/10" },
    { label: "التقارير", icon: BarChart3, path: "/reports", color: "text-emerald-600 bg-emerald-500/10" },
    { label: "المرفقات", icon: Paperclip, path: "/receipts", color: "text-amber-600 bg-amber-500/10" },
    { label: "إدارة المستخدمين", icon: Users, path: "/users", color: "text-violet-600 bg-violet-500/10" },
  ];

  const stats = [
    { label: "إجمالي المتحصلات", value: formatMoney(approvedCollections), sub: `${approved.length} سند معتمد`, icon: WalletCards, color: "text-primary bg-primary/10" },
    { label: "سندات القبض", value: formatNumber(receipts.length), sub: "إجمالي السندات المسجلة", icon: Receipt, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "المستخدمون النشطون", value: formatNumber(users.filter((u) => u.isActive).length), sub: "من ضمن متعددين", icon: Users, color: "text-violet-600 bg-violet-500/10" },
    { label: "تقارير الأداء", value: formatNumber(reports.length), sub: "للفترة الحالية", icon: TrendingUp, color: "text-amber-600 bg-amber-500/10" },
  ];

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">مرحباً {user?.fullName}، إليك ملخص أداء المنصة اليوم</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/receipts")}><FilePlus2 className="h-4 w-4 ml-2" />إصدار سند قبض</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">المتحصلات حسب الفرع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                  <Bar dataKey="collections" name="المتحصلات" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">اختصارات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shortcuts.map((sc) => {
              const Icon = sc.icon;
              return (
                <button key={sc.label} onClick={() => setLocation(sc.path)} className="w-full flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-3 text-right transition hover:bg-muted/60">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${sc.color}`}><Icon className="h-4 w-4" /></span>
                  <span className="text-sm font-medium">{sc.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">اتجاه المبيعات والمتحصلات</CardTitle>
          {isAdmin && <Badge variant="secondary">عرض المدير العام</Badge>}
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="مبيعات" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="متحصلات" stroke="var(--color-secondary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
