import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building2, Palette, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsPage() {
  const { colorMode, setColorMode, interaction, setInteraction } = useTheme();
  const [company, setCompany] = useState({
    companyName: "شركة الأسمدة المتحدة السعودية",
    address: "الرياض، المملكة العربية السعودية",
    commercialRegister: "1010234567",
    taxNumber: "300012345600003",
    phone: "0112345678",
  });

  const interactions = [
    { value: "azure", label: "أزرق" },
    { value: "emerald", label: "زمردي" },
    { value: "violet", label: "بنفسجي" },
    { value: "coral", label: "مرجاني" },
    { value: "amber", label: "كهرماني" },
  ];

  const saveCompany = () => toast.success("تم حفظ ملف الشركة بنجاح");

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">إعدادات النظام</h1>
        <p className="text-sm text-muted-foreground mt-1">ملف الشركة، المظهر، والتسميات القابلة للتعديل</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" />ملف الشركة</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>اسم الشركة</Label>
            <Input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>السجل التجاري</Label>
            <Input value={company.commercialRegister} onChange={(e) => setCompany({ ...company, commercialRegister: e.target.value })} className="ltr-content" />
          </div>
          <div className="space-y-2">
            <Label>الرقم الضريبي</Label>
            <Input value={company.taxNumber} onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })} className="ltr-content" />
          </div>
          <div className="space-y-2">
            <Label>الهاتف</Label>
            <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="ltr-content" />
          </div>
          <div className="flex items-end">
            <Button onClick={saveCompany} className="w-full sm:w-auto">حفظ</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-primary" />المظهر والتفاعل</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
            <div>
              <p className="flex items-center gap-2 font-medium">{colorMode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} الوضع الداكن</p>
              <p className="text-xs text-muted-foreground mt-1">يُحفظ الاختيار لهذا المستخدم ويُطبَّق فوراً</p>
            </div>
            <Switch checked={colorMode === "dark"} onCheckedChange={(v) => setColorMode(v ? "dark" : "light")} />
          </div>
          <div className="space-y-2">
            <Label>لون عنصر المرور/التفاعل</Label>
            <Select value={interaction} onValueChange={(v) => setInteraction(v as any)}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {interactions.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">التسميات القابلة للتعديل (Labels)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            ["receipt_print_received_from", "استلمنا من المكرم"],
            ["login_username", "اسم المستخدم"],
            ["login_password", "كلمة المرور"],
            ["nav_dashboard", "لوحة التحكم"],
          ].map(([key, def]) => (
            <div key={key} className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center">
              <Label className="text-xs font-mono text-muted-foreground">{key}</Label>
              <Input defaultValue={def} onBlur={() => toast.success(`تم تحديث التسمية ${key}`)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
