import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/FileDropzone";
import { Plus, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { PAYMENT_METHODS, BANKS } from "@/lib/mockData";
import { formatMoney } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ beneficiary: "", amount: "", category: "", method: "نقداً", bank: "", description: "" });
  const [attached, setAttached] = useState(false);

  const load = () => api.payments().then(setPayments).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.beneficiary || !form.amount) { toast.error("يرجى إدخال المستفيد والمبلغ"); return; }
    try {
      await api.createPayment({
        beneficiary: form.beneficiary, amount: Number(form.amount), expenseCategory: form.category || "عام",
        paymentMethod: form.method, bank: form.method === "نقداً" ? "—" : form.bank || BANKS[0], description: form.description,
      });
      await load();
      setShowForm(false);
      setForm({ beneficiary: "", amount: "", category: "", method: "نقداً", bank: "", description: "" });
      toast.success("تم إصدار سند الصرف بنجاح");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سندات الصرف</h1>
          <p className="text-sm text-muted-foreground mt-1">إصدار سندات الصرف بالمستفيد والمبلغ وطريقة الدفع</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-2" />إصدار سند صرف</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" />نموذج سند صرف</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>المستفيد *</Label>
              <Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ر.س) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="numeric-field" />
            </div>
            <div className="space-y-2">
              <Label>فئة المصروف</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {["نقل", "شراء بضاعة", "رواتب", "صيانة", "عمومية"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>البنك</Label>
              <Select value={form.bank} onValueChange={(v) => setForm({ ...form, bank: v })} disabled={form.method === "نقداً"}>
                <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <FileDropzone label="إرفاق مستند الصرف" description="مرفق اختياري لدعم السند." accept=".pdf,.png,.jpg,.jpeg,.xlsx" maxBytes={5 * 1024 * 1024} onFileSelected={() => setAttached(true)} onClear={() => setAttached(false)} value={attached ? "x" : null} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
              <Button onClick={submit}>إصدار السند</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">سجل سندات الصرف</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم السند</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>فئة المصروف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.serialNumber}</TableCell>
                    <TableCell>{p.beneficiary}</TableCell>
                    <TableCell>{p.expenseCategory}</TableCell>
                    <TableCell className="font-bold">{formatMoney(p.amount)}</TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge className={p.status === "approved" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}>{p.status === "approved" ? "معتمد" : "مصدر"}</Badge>
                    </TableCell>
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
