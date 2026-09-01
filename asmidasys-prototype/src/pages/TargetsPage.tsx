import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Target } from "lucide-react";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";
import { formatMoney } from "@/lib/utils";

export default function TargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [form, setForm] = useState({ branch: "1", type: "مبيعات", target: "" });

  const load = () => api.targets().then(setTargets).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.target) { toast.error("يرجى إدخال القيمة المستهدفة"); return; }
    try {
      await api.createTarget({ branchId: Number(form.branch), type: form.type, targetValue: Number(form.target) });
      await load();
      toast.success("تم إضافة الهدف");
    } catch (e: any) { toast.error(e.message); }
  };

  const branchName = (id: any) => BRANCHES.find((b) => b.id === id)?.name || "—";

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأهداف</h1>
          <p className="text-sm text-muted-foreground mt-1">أهداف المبيعات والمتحصلات لكل فرع وفترة</p>
        </div>
        <Button onClick={submit}><Plus className="h-4 w-4 ml-2" />إضافة هدف</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" />هدف جديد</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>الفرع</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BRANCHES.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
          </div>
          <div className="space-y-2"><Label>النوع</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="مبيعات">مبيعات</SelectItem>
                <SelectItem value="متحصلات">متحصلات</SelectItem>
                <SelectItem value="هدف مخصص">هدف مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>القيمة المستهدفة (ر.س)</Label><Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="numeric-field" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">الأهداف الحالية</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفرع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الهدف</TableHead>
                  <TableHead>الحالي</TableHead>
                  <TableHead className="w-1/3">نسبة الإنجاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => {
                  const pct = t.targetValue ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{branchName(t.branchId)}</TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell>{formatMoney(t.targetValue)}</TableCell>
                      <TableCell>{formatMoney(t.currentValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs font-semibold">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
