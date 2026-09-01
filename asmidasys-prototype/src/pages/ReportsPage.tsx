import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileBarChart, TrendingUp, WalletCards } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";
import { formatMoney, formatNumber } from "@/lib/utils";

const rangeLabels = ["today", "yesterday", "week", "custom"] as const;

export default function ReportsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState("collections");
  const [range, setRange] = useState<(typeof rangeLabels)[number]>("today");
  const [branchId, setBranchId] = useState<string>("all");

  useEffect(() => {
    Promise.all([api.receipts(), api.performanceReports()])
      .then(([r, rep]) => { setReceipts(r); setReports(rep); })
      .catch(() => {});
  }, []);

  const branchReceipts = receipts.filter((r) => branchId === "all" || r.branchId === Number(branchId));
  const branchData = BRANCHES.map((b) => {
    const val = receipts.filter((r) => r.branchId === b.id && r.status !== "rejected").reduce((s, r) => s + r.amount, 0);
    return { name: b.name, value: val };
  }).filter((d) => d.value > 0);
  const totalCollections = branchReceipts.filter((r) => r.status !== "rejected").reduce((s, r) => s + r.amount, 0);
  const approvedCount = branchReceipts.filter((r) => r.status === "approved").length;
  const pieData = [
    { name: "معتمد", value: receipts.filter((r) => r.status === "approved").length },
    { name: "مصدر", value: receipts.filter((r) => r.status === "issued").length },
    { name: "مرفوض", value: receipts.filter((r) => r.status === "rejected").length },
  ];
  const COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-destructive)"];

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-sm text-muted-foreground mt-1">تقارير المتحصلات البنكية والأداء مع فلاتر وإجماليات مباشرة</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("تم تجهيز تقرير PDF للتنزيل")}><Download className="h-4 w-4 ml-2" />تصدير PDF</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={range} onValueChange={(v) => setRange(v as any)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">اليوم</SelectItem>
            <SelectItem value="yesterday">أمس</SelectItem>
            <SelectItem value="week">آخر أسبوع</SelectItem>
            <SelectItem value="custom">فترة مخصصة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفروع</SelectItem>
            {BRANCHES.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <WalletCards className="h-4 w-4 text-primary" />
          إجمالي المتحصلات: <b className="text-foreground">{formatMoney(totalCollections)}</b>
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="collections"><WalletCards className="h-4 w-4 ml-1" />متحصلات بنكية</TabsTrigger>
          <TabsTrigger value="performance"><TrendingUp className="h-4 w-4 ml-1" />أداء الفروع</TabsTrigger>
          <TabsTrigger value="charts"><FileBarChart className="h-4 w-4 ml-1" />تحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل المتحصلات</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>البنك</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchReceipts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد سجلات</TableCell></TableRow>}
                    {branchReceipts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.serialNumber}</TableCell>
                        <TableCell>{BRANCHES.find((b) => b.id === r.branchId)?.name}</TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell>{r.bank}</TableCell>
                        <TableCell className="font-bold">{formatMoney(r.amount)}</TableCell>
                        <TableCell>
                          <Badge className={r.status === "approved" ? "bg-emerald-500/10 text-emerald-700" : r.status === "rejected" ? "bg-red-500/10 text-red-700" : "bg-amber-500/10 text-amber-700"}>
                            {r.status === "approved" ? "معتمد" : r.status === "rejected" ? "مرفوض" : "مصدر"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">أداء الفروع (مبيعات ومتحصلات)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفرع</TableHead>
                      <TableHead>عدد المبيعات</TableHead>
                      <TableHead>قيمة المبيعات</TableHead>
                      <TableHead>المرتجعات</TableHead>
                      <TableHead>صافي المبيعات</TableHead>
                      <TableHead>المتحصلات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BRANCHES.map((b) => {
                      const r = reports.find((x) => x.branchId === b.id);
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{r ? formatNumber(r.salesCount) : "—"}</TableCell>
                          <TableCell>{r ? formatMoney(r.salesValue) : "—"}</TableCell>
                          <TableCell>{r ? formatMoney(r.returnsValue) : "—"}</TableCell>
                          <TableCell className="font-bold">{r ? formatMoney(r.netSales) : "—"}</TableCell>
                          <TableCell>{r ? formatMoney(r.collections) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">المتحصلات حسب الفرع</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                      <Bar dataKey="value" name="المتحصلات" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">توزيع حالات السندات</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(v: any) => formatNumber(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
