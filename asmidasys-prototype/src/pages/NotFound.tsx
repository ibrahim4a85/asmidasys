import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-black text-primary">404</h1>
        <p className="text-lg font-medium">الصفحة غير موجودة</p>
        <p className="text-sm text-muted-foreground">عذراً، لا يمكننا العثور على الصفحة التي طلبتها.</p>
        <Button onClick={() => setLocation("/dashboard")}>العودة للوحة التحكم</Button>
      </div>
    </div>
  );
}
