import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCircle, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { BRANCHES } from "@/lib/mockData";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ number: "", name: "", branch: "1", phone: "" });

  const load = () => api.customers().then(setCustomers).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.number) { toast.error("يرجى إدخال الرقم والاسم"); return; }
    try {
      await api.createCustomer({ customerNumber: Number(form.number), name: form.name, branchId: Number(form.branch), phone: form.phone });
      await load();
      setShowForm(false);
      setForm({ number: "", name: "", branch: "1", phone: "" });
      toast.success("تم إضافة العميل");
    } catch (e: any) { toast.error(e.message); }
  };

  const branchName = (id: any) => BRANCHES.find((b) => b.id === id)?.name || "—";
  const filtered = customers.filter((c) => !query || c.name.includes(query) || String(c.customerNumber).includes(query));

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">إنشاء وتعديل وتعطيل العملاء مع استيراد Excel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("تم تجهيز قالب Excel للتحميل")}><Upload className="h-4 w-4 ml-2" />استيراد Excel</Button>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-2" />عميل جديد</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserCircle className="h-4 w-4 text-primary" />إضافة عميل</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>رقم العميل *</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="numeric-field" /></div>
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الفرع</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BRANCHES.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ltr-content" /></div>
            <div className="sm:col-span-2 flex justify-end"><Button onClick={submit}>حفظ العميل</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">قائمة العملاء ({filtered.length})</CardTitle>
          <div className="w-full sm:w-64"><Input placeholder="بحث بالرقم أو الاسم..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العميل</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-primary">{c.customerNumber}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{branchName(c.branchId)}</TableCell>
                    <TableCell dir="ltr" className="text-left">{c.phone}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">نشط</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
