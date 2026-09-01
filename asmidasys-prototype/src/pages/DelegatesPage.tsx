import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDropzone } from "@/components/FileDropzone";
import { Plus, Shield, Eye } from "lucide-react";
import { api } from "@/lib/api";

export default function DelegatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [attached, setAttached] = useState(false);
  const [form, setForm] = useState({ type: "تعميد اعتماد سندات", applicant: "" });

  const load = () => api.delegations().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.applicant) { toast.error("يرجى إدخال اسم مقدم الطلب"); return; }
    try {
      await api.createDelegation({ type: form.type, applicantName: form.applicant });
      await load();
      setOpen(false);
      setAttached(false);
      toast.success("تم إنشاء طلب التعميد بنجاح");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التعميدات</h1>
          <p className="text-sm text-muted-foreground mt-1">سير تعميد قابل للتهيئة مع المراجعين والمفوضين والمرفقات</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 ml-2" />طلب تعميد</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" />قائمة طلبات التعميد</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>مقدم الطلب</TableHead>
                  <TableHead>المرفق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.requestNumber}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{a.applicantName}</TableCell>
                    <TableCell>{a.attachmentName || "—"}</TableCell>
                    <TableCell>
                      <Badge className={a.status === "تم التعميد" ? "bg-emerald-500/10 text-emerald-700" : a.status === "قيد المراجعة" ? "bg-amber-500/10 text-amber-700" : "bg-primary/10 text-primary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="icon" onClick={() => setPreview(a)}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-lg text-right">
          <DialogHeader><DialogTitle>طلب تعميد جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>نوع التعميد</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="تعميد اعتماد سندات">تعميد اعتماد سندات</SelectItem>
                  <SelectItem value="تعميد مراجعة">تعميد مراجعة</SelectItem>
                  <SelectItem value="تعميد مالي">تعميد مالي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>مقدم الطلب</Label><Input value={form.applicant} onChange={(e) => setForm({ ...form, applicant: e.target.value })} /></div>
            <FileDropzone label="إرفاق المستند المرجعي" description="Word / Excel / PDF — يُضاف رقم التعميد تلقائياً عند المعاينة." accept=".pdf,.doc,.docx,.xls,.xlsx" maxBytes={10 * 1024 * 1024} onFileSelected={() => setAttached(true)} onClear={() => setAttached(false)} value={attached ? "x" : null} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={submit}>إرسال الطلب</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent dir="rtl" className="max-w-md text-right">
          <DialogHeader><DialogTitle>تفاصيل التعميد {preview?.requestNumber}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-2 text-sm">
              <p>النوع: <b>{preview.type}</b></p>
              <p>مقدم الطلب: <b>{preview.applicantName}</b></p>
              <p>تاريخ الإنشاء: <b>{preview.createdAt?.slice(0, 10)}</b></p>
              <p>الحالة: <Badge>{preview.status}</Badge></p>
              <p className="text-muted-foreground">مسار الحالة: تم الإرسال ← قيد المراجعة ← تمّت المراجعة والإرسال للمفوضين ← تم التعميد.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
