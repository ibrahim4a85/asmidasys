import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/FileDropzone";
import { Plus, Check, X, Eye, Download, Paperclip, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PAYMENT_METHODS, BANKS, PAYMENT_FOR, BRANCHES } from "@/lib/mockData";
import { formatMoney } from "@/lib/utils";

const statusMeta: Record<string, { label: string; cls: string }> = {
  issued: { label: "مصدر", cls: "bg-amber-500/10 text-amber-700" },
  approved: { label: "معتمد", cls: "bg-emerald-500/10 text-emerald-700" },
  rejected: { label: "مرفوض", cls: "bg-red-500/10 text-red-700" },
  draft: { label: "مسودة", cls: "bg-muted text-muted-foreground" },
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [tab, setTab] = useState("list");
  const [preview, setPreview] = useState<any | null>(null);
  const [form, setForm] = useState({
    branchId: "4",
    customerName: "",
    amount: "",
    paymentMethod: "نقداً",
    bank: "",
    paymentFor: "",
    customerStatement: "",
    notes: "",
  });
  const [attached, setAttached] = useState<{ name: string; size: number; file?: File } | null>(null);

  const method = PAYMENT_METHODS.find((m) => m.name === form.paymentMethod);
  const needsAttachment = method?.requiresAttachment || false;

  const refresh = () => api.receipts().then(setReceipts).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const submit = async () => {
    if (!form.customerName || !form.amount || Number(form.amount) <= 0) {
      toast.error("يرجى إدخال العميل والمبلغ");
      return;
    }
    if (needsAttachment && !attached) {
      toast.error(`طريقة الدفع "${form.paymentMethod}" تتطلب إرفاق إيصال التحويل`);
      return;
    }
    try {
      let uploadResult: { url?: string; fileName?: string } | null = null;
      if (attached) {
        const fileObj = attached as any;
        uploadResult = await api.upload(fileObj.file, "مرفق سند قبض");
      }
      const payload = {
        branchId: Number(form.branchId),
        customerName: form.customerName,
        amount: Number(form.amount),
        amountInWords: "مبلغ كتابةً عربياً",
        paymentMethod: form.paymentMethod,
        bank: form.paymentMethod === "نقداً" ? "—" : form.bank || BANKS[0],
        paymentFor: form.paymentFor,
        customerStatement: form.customerStatement,
        notes: form.notes,
        attachmentUrl: uploadResult?.url || null,
        attachmentName: uploadResult?.fileName || null,
      };
      const created = await api.createReceipt(payload);
      await refresh();
      setForm({ branchId: "4", customerName: "", amount: "", paymentMethod: "نقداً", bank: "", paymentFor: "", customerStatement: "", notes: "" });
      setAttached(null);
      toast.success(`تم إصدار سند القبض ${created.serialNumber} بنجاح`);
      setTab("list");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const decide = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.decideReceipt(id, status);
      await refresh();
      toast.success(status === "approved" ? "تم اعتماد السند" : "تم رفض السند");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const branchName = (id: number) => BRANCHES.find((b) => b.id === id)?.name || "";

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">سندات القبض</h1>
        <p className="text-sm text-muted-foreground mt-1">إصدار السندات وإرفاق الملفات المطلوبة وإدارة الاعتماد</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="list">عرض السندات</TabsTrigger>
          <TabsTrigger value="create">إصدار سند قبض</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">نموذج إصدار سند قبض</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label>اسم العميل *</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ر.س) *</Label>
                <Input type="number" className="numeric-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>المبلغ كتابةً</Label>
                <Input value="مبلغ كتابةً عربياً" readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}{m.requiresAttachment ? " (يتطلب مرفق)" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>البنك</Label>
                <Select value={form.bank} onValueChange={(v) => setForm({ ...form, bank: v })} disabled={form.paymentMethod === "نقداً"}>
                  <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وذلك مقابل</Label>
                <Select value={form.paymentFor} onValueChange={(v) => setForm({ ...form, paymentFor: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FOR.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>بيان / ملاحظات (اختياري)</Label>
                <Textarea rows={2} value={form.customerStatement} onChange={(e) => setForm({ ...form, customerStatement: e.target.value })} placeholder="مثال: سداد الرصيد" />
              </div>

              <div className="sm:col-span-2">
                <FileDropzone
                  label="إرفاق إيصال التحويل"
                  description={needsAttachment ? "هذه طريقة دفع تتطلب إرفاق الملف قبل الإصدار." : "إرفاق اختياري حسب طريقة الدفع."}
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx"
                  maxBytes={5 * 1024 * 1024}
                  value={attached ? undefined : null}
                  onFileSelected={(f) => setAttached({ name: f.name, size: f.size, file: f })}
                  onClear={() => setAttached(null)}
                />
                {needsAttachment && !attached && <p className="mt-1 text-xs text-amber-600">* مطلوب: إرفاق إيصال التحويل لهذه الطريقة</p>}
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTab("list")}>إلغاء</Button>
                <Button onClick={submit}><Plus className="h-4 w-4 ml-2" />إصدار السند</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">سجل السندات ({receipts.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { toast.info("تم تجهيز ملف PDF للطباعة"); }}><Download className="h-4 w-4 ml-1" />طباعة</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>المرفق</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد سندات بعد</TableCell></TableRow>}
                    {receipts.map((r) => {
                      const st = statusMeta[r.status];
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold">{r.serialNumber}</TableCell>
                          <TableCell>{branchName(r.branchId)}</TableCell>
                          <TableCell>{r.customerName}</TableCell>
                          <TableCell className="font-bold text-base">{formatMoney(r.amount)}</TableCell>
                          <TableCell>{r.paymentMethod}</TableCell>
                          <TableCell>
                            {r.attachmentName ? (
                              <span className="inline-flex items-center gap-1 text-xs text-primary"><Paperclip className="h-3 w-3" />مرفق</span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell><Badge className={st.cls}>{st.label}</Badge></TableCell>
                          <TableCell className="text-left">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setPreview(r)} aria-label="معاينة"><Eye className="h-4 w-4" /></Button>
                              {r.status === "issued" && (
                                <>
                                  <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => decide(r.id, "approved")} aria-label="اعتماد"><Check className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => decide(r.id, "rejected")} aria-label="رفض"><X className="h-4 w-4" /></Button>
                                </>
                              )}
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
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(preview)} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent dir="rtl" className="max-w-lg text-right">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />معاينة سند القبض {preview?.serialNumber}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="rounded-xl border p-5 space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                  <div>
                    <p className="font-bold">شركة الأسمدة المتحدة السعودية</p>
                    <p className="text-xs text-muted-foreground">سند قبض {preview.serialNumber}</p>
                  </div>
                </div>
                <Badge className={statusMeta[preview.status].cls}>{statusMeta[preview.status].label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">الفرع: <span className="text-foreground font-medium">{branchName(preview.branchId)}</span></p>
                <p className="text-muted-foreground">التاريخ: <span className="text-foreground font-medium">{new Date(preview.createdAt).toLocaleDateString("ar-SA")}</span></p>
                <p className="text-muted-foreground">العميل: <span className="text-foreground font-medium">{preview.customerName}</span></p>
                <p className="text-muted-foreground">المبلغ: <span className="text-foreground font-bold">{formatMoney(preview.amount)}</span></p>
                <p className="text-muted-foreground">طريقة الدفع: <span className="text-foreground font-medium">{preview.paymentMethod}</span></p>
                <p className="text-muted-foreground">البنك: <span className="text-foreground font-medium">{preview.bank}</span></p>
              </div>
              {preview.customerStatement && (
                <p className="text-sm text-muted-foreground">البيان: <span className="text-foreground">{preview.customerStatement}</span></p>
              )}
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground mb-1">استلمنا من المكرم</p>
                <p className="font-medium">{preview.customerName}</p>
                {preview.customerStatement && <p className="whitespace-pre-line text-muted-foreground">{preview.customerStatement}</p>}
              </div>
              {preview.attachmentName && (
                <p className="flex items-center gap-2 text-xs text-primary"><Paperclip className="h-3 w-3" />{preview.attachmentName}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
