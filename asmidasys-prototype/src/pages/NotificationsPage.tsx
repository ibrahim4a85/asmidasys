import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => { api.notifications().then(setNotifications).catch(() => {}); }, []);

  const markAll = async () => {
    try {
      await api.readAllNotifications();
      setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="rtl-page space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سجل الإشعارات</h1>
          <p className="text-sm text-muted-foreground mt-1">جميع التنبيهات على سندات القبض وطلبات التعميد</p>
        </div>
        <Button variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4 ml-2" />تعيين الكل كمقروء</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">قائمة الإشعارات</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 && <p className="py-10 text-center text-muted-foreground">لا توجد إشعارات</p>}
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 rounded-xl border p-4", !n.isRead && "bg-primary/5")}>
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.isRead ? "bg-muted" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {!n.isRead && <Badge variant="secondary">جديد</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("ar-SA")}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
