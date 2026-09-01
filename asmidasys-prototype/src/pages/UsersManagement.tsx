import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { api } from "@/lib/api";
import { USER_TYPE_DEFINITIONS, BRANCHES } from "@/lib/mockData";
import { useSystemAuth } from "@/contexts/AuthContext";

const permissionGroups: { key: string; label: string; items: { key: string; label: string }[] }[] = [
  {
    key: "القائمة الجانبية",
    label: "القائمة الجانبية",
    items: [
      { key: "sidebar_dashboard", label: "لوحة التحكم" },
      { key: "sidebar_receipts", label: "سندات القبض" },
      { key: "sidebar_payments", label: "سندات الصرف" },
      { key: "sidebar_reports", label: "التقارير" },
      { key: "sidebar_users", label: "إدارة المستخدمين" },
    ],
  },
  {
    key: "الصلاحيات الدقيقة",
    label: "الصلاحيات الدقيقة",
    items: [
      { key: "customersManage", label: "إدارة العملاء" },
      { key: "targetsManage", label: "إدارة الأهداف" },
      { key: "receiptsApprove", label: "اعتماد سندات القبض" },
      { key: "reportsView", label: "عرض التقارير" },
      { key: "usersManage", label: "إدارة المستخدمين" },
      { key: "dataDelete", label: "إدارة النسخ الاحتياطي والحذف" },
      { key: "approvalRequest", label: "طلب التعميد" },
      { key: "approvalDelegate", label: "التعميد" },
      { key: "partnerRightsView", label: "عرض حقوق الشركاء" },
      { key: "partnerRightsManage", label: "إدارة حقوق الشركاء" },
    ],
  },
];

const emptyPermissions = (() => {
  const p: Record<string, boolean> = {};
  permissionGroups.forEach((g) => g.items.forEach((i) => (p[i.key] = false)));
  return p;
})();

const userTypeLabel = (code: string) => USER_TYPE_DEFINITIONS.find((d) => d.code === code)?.label || code;

export default function UsersManagement() {
  const { isAdmin, user } = useSystemAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [query, setQuery] = useState("");

  const load = () => api.users().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    userType: "delegate",
    userLevel: "secondary" as "primary" | "secondary",
    branchId: null as number | null,
    phone: "",
    email: "",
    boardPosition: "",
    isActive: true,
    permissions: { ...emptyPermissions },
  });

  const resetForm = () => {
    setForm({ username: "", password: "", fullName: "", userType: "delegate", userLevel: "secondary", branchId: null, phone: "", email: "", boardPosition: "", isActive: true, permissions: { ...emptyPermissions } });
    setEditUser(null);
  };

  const save = async () => {
    if (!form.fullName || !form.username) { toast.error("يرجى ملء الاسم واسم المستخدم"); return; }
    try {
      if (editUser) {
        const { password, ...rest } = form;
        const data = { ...rest, password: password ? password : editUser.password };
        await api.updateUser(editUser.id, data);
        toast.success("تم تحديث المستخدم بنجاح");
      } else {
        if (!form.password) { toast.error("يرجى إدخال كلمة المرور للمستخدم الجديد"); return; }
        await api.createUser(form);
        toast.success("تم إضافة المستخدم بنجاح");
      }
      await load();
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.deleteUser(deleteUser.id);
      await load();
      setDeleteUser(null);
      toast.success("تم حذف المستخدم");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ username: u.username, password: "", fullName: u.fullName, userType: u.userType, userLevel: u.userLevel, branchId: u.branchId, phone: u.phone, email: u.email, boardPosition: u.boardPosition, isActive: u.isActive, permissions: { ...emptyPermissions, ...u.permissions } });
    setOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [users, query]);

  if (!isAdmin) {
    return <div className="text-center py-20 text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة</div>;
  }

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-sm text-muted-foreground mt-1">إضافة وإدارة مستخدمي النظام وصلاحياتهم الدقيقة (متعددون)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 ml-2" />إضافة مستخدم</Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[92dvh] max-w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-w-2xl" dir="rtl">
            <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle>{editUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>اسم المستخدم *</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{editUser ? "كلمة المرور الجديدة" : "كلمة المرور *"}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>نوع المستخدم</Label>
                  <Select value={form.userType} onValueChange={(v) => setForm({ ...form, userType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {USER_TYPE_DEFINITIONS.map((d) => <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المستوى</Label>
                  <Select value={form.userLevel} onValueChange={(v) => setForm({ ...form, userLevel: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">رئيسي</SelectItem>
                      <SelectItem value="secondary">فرعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الفرع</Label>
                  <Select value={form.branchId?.toString() || ""} onValueChange={(v) => setForm({ ...form, branchId: v ? parseInt(v) : null })}>
                    <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map((b) => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>المنصب / صفة مجلس الإدارة</Label>
                  <Input value={form.boardPosition} onChange={(e) => setForm({ ...form, boardPosition: e.target.value })} placeholder="مثال: رئيس مجلس الإدارة" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <span className="text-sm font-medium">حساب نشط (يمكنه تسجيل الدخول)</span>
              </div>

              <div className="mt-6 space-y-4">
                {permissionGroups.map((group) => (
                  <div key={group.key} className="rounded-xl border p-4">
                    <p className="mb-3 text-sm font-bold">{group.label}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.items.map((perm) => (
                        <label key={perm.key} className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-muted/40">
                          <Checkbox
                            checked={Boolean(form.permissions[perm.key])}
                            onCheckedChange={(v) => setForm({ ...form, permissions: { ...form.permissions, [perm.key]: Boolean(v) } })}
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={save}>{editUser ? "حفظ التعديلات" : "إضافة المستخدم"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">قائمة المستخدمين ({filtered.length})</CardTitle>
          <div className="w-full sm:w-64">
            <Input placeholder="بحث بالاسم أو اسم المستخدم..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>نوع المستخدم</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا يوجد مستخدمون مطابقون</TableCell></TableRow>
                )}
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{u.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={u.userType === "admin" ? "default" : "secondary"}>{userTypeLabel(u.userType)}</Badge></TableCell>
                    <TableCell>{u.branchId ? BRANCHES.find((b) => b.id === u.branchId)?.name : "—"}</TableCell>
                    <TableCell>{u.userLevel === "primary" ? "رئيسي" : "فرعي"}</TableCell>
                    <TableCell dir="ltr" className="text-left">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "secondary" : "outline"} className={u.isActive ? "bg-emerald-500/10 text-emerald-700" : ""}>
                        {u.isActive ? "نشط" : "معطّل"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="تعديل"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteUser(u)} disabled={u.id === user?.id} aria-label="حذف"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={Boolean(deleteUser)}
        onOpenChange={(v) => !v && setDeleteUser(null)}
        title="حذف مستخدم"
        description={`هل أنت متأكد من حذف المستخدم "${deleteUser?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
