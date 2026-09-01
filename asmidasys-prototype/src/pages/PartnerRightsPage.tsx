import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDropzone } from "@/components/FileDropzone";
import { WalletCards, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

export default function PartnerRightsPage() {
  const [tab, setTab] = useState("report");
  const [partners, setPartners] = useState<any[]>([]);
  const [attached, setAttached] = useState(false);
  const [form, setForm] = useState({ partner: "", amount: "", statement: "" });

  useEffect(() => { api.partners().then((p) => { setPartners(p); if (p[0]) setForm((f) => ({ ...f, partner: p[0].name })); }).catch(() => {}); }, []);

  const addEntry = () => {
    if (!form.amount) { toast.error("يرجى إدخال المبلغ"); return; }
    toast.success("تم تسجيل الحركة بنجاح");
    setForm({ ...form, amount: "", statement: "" });
  };

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">حقوق الشركاء</h1>
        <p className="text-sm text-muted-foreground mt-1">توزيعات الأرباح وإدارة حصص الشركاء وحساباتهم الجارية</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="report">تقرير توزيعات الأرباح</TabsTrigger>
          <TabsTrigger value="entry">إضافة سجل</TabsTrigger>
          <TabsTrigger value="manage">إدارة حصص الشركاء</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><WalletCards className="h-4 w-4 text-primary" />تقرير توزيعات الأرباح</CardTitle>
              <Select defaultValue="2026">
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">فترة 2026</SelectItem>
                  <SelectItem value="2025">فترة 2025</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشريك</TableHead>
                      <TableHead>نسبة الحصة</TableHead>
                      <TableHead>الرصيد الافتتاحي</TableHead>
                      <TableHead>الحركات</TableHead>
                      <TableHead>الرصيد الختامي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.sharePercent}%</TableCell>
                        <TableCell>{formatMoney(p.openingBalance)}</TableCell>
                        <TableCell>{formatMoney(0)}</TableCell>
                        <TableCell className="font-bold text-primary">{formatMoney(p.openingBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تسجيل مسحوبات / استحقاقات</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>الشريك</Label>
                <Select value={form.partner} onValueChange={(v) => setForm({ ...form, partner: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{partners.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>الاتجاه</Label>
                <Select defaultValue="withdrawal">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">مسحوبات</SelectItem>
                    <SelectItem value="accrual">استحقاق</SelectItem>
                    <SelectItem value="settlement">تسوية نهاية العام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>البيان</Label><Input value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} /></div>
              <div className="space-y-2"><Label>المبلغ (ر.س)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="numeric-field" /></div>
              <div className="sm:col-span-2">
                <FileDropzone label="مرفق اختياري" description="مرفق يدعم القيد (مثل إيصال أو قرار توزيع)." accept=".pdf,.png,.jpg" maxBytes={5 * 1024 * 1024} onFileSelected={() => setAttached(true)} onClear={() => setAttached(false)} value={attached ? "x" : null} />
              </div>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={addEntry}><Plus className="h-4 w-4 ml-2" />تسجيل القيد</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">إدارة حصص الشركاء</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partners.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">الحصة: {p.sharePercent}% · الرصيد: {formatMoney(p.openingBalance)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info("فتح إعداد الحصة")}>تعديل</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
