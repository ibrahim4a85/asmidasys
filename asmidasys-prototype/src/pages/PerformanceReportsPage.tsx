import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";
import { formatMoney, formatNumber } from "@/lib/utils";

export default function PerformanceReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState("entries");
  const [form, setForm] = useState({
    branchId: "1",
    reportDate: new Date().toISOString().slice(0, 10),
    salesCount: "",
    salesValue: "",
    returnsCount: "",
    returnsValue: "",
    receiptsCount: "",
    collections: "",
  });

  const refresh = () => api.performanceReports().then(setReports).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const netSales = (Number(form.salesValue) || 0) - (Number(form.returnsValue) || 0);

  const submit = async () => {
    if (!form.salesValue) { toast.error("يرجى إدخال قيمة المبيعات"); return; }
    try {
      await api.createPerformanceReport({
        branchId: Number(form.branchId),
        reportDate: form.reportDate,
        salesCount: Number(form.salesCount) || 0,
        salesValue: Number(form.salesValue),
        returnsCount: Number(form.returnsCount) || 0,
        returnsValue: Number(form.returnsValue) || 0,
        receiptsCount: Number(form.receiptsCount) || 0,
        collections: Number(form.collections) || 0,
      });
      await refresh();
      setForm({ branchId: "1", reportDate: new Date().toISOString().slice(0, 10), salesCount: "", salesValue: "", returnsCount: "", returnsValue: "", receiptsCount: "", collections: "" });
      toast.success("تم تسجيل تقرير الأداء بنجاح");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">تقارير الأداء</h1>
        <p className="text-sm text-muted-foreground mt-1">إدخال يومي لمبيعات ومتحصلات كل فرع مع منع السجل المكرر</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="entries">إدخال الأداء</TabsTrigger>
          <TabsTrigger value="view">كل الفروع</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تقرير أداء يومي</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>الفرع</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} className="ltr-content" />
              </div>
              <div className="space-y-2">
                <Label>عدد المبيعات</Label>
                <Input type="number" value={form.salesCount} onChange={(e) => setForm({ ...form, salesCount: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2">
                <Label>قيمة المبيعات (ر.س)</Label>
                <Input type="number" value={form.salesValue} onChange={(e) => setForm({ ...form, salesValue: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2">
                <Label>عدد المرتجعات</Label>
                <Input type="number" value={form.returnsCount} onChange={(e) => setForm({ ...form, returnsCount: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2">
                <Label>قيمة المرتجعات (ر.س)</Label>
                <Input type="number" value={form.returnsValue} onChange={(e) => setForm({ ...form, returnsValue: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2">
                <Label>عدد سندات القبض</Label>
                <Input type="number" value={form.receiptsCount} onChange={(e) => setForm({ ...form, receiptsCount: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2">
                <Label>قيمة المتحصلات (ر.س)</Label>
                <Input type="number" value={form.collections} onChange={(e) => setForm({ ...form, collections: e.target.value })} className="numeric-field" />
              </div>
              <div className="space-y-2 flex items-end">
                <div className="w-full rounded-lg border bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">صافي المبيعات (يُحسب تلقائياً)</p>
                  <p className="text-lg font-bold text-primary">{formatMoney(netSales)}</p>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                <Button onClick={submit}><Save className="h-4 w-4 ml-2" />حفظ التقرير</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تقارير كل الفروع</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفرع</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>مبيعات</TableHead>
                      <TableHead>مرتجعات</TableHead>
                      <TableHead>صافي</TableHead>
                      <TableHead>متحصلات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice().sort((a, b) => b.reportDate.localeCompare(a.reportDate)).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{BRANCHES.find((b) => b.id === r.branchId)?.name}</TableCell>
                        <TableCell>{r.reportDate}</TableCell>
                        <TableCell>{formatNumber(r.salesCount)} · {formatMoney(r.salesValue)}</TableCell>
                        <TableCell>{formatNumber(r.returnsCount)} · {formatMoney(r.returnsValue)}</TableCell>
                        <TableCell className="font-bold">{formatMoney(r.netSales)}</TableCell>
                        <TableCell className="font-bold text-primary">{formatMoney(r.collections)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
