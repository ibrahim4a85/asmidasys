import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSystemAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { Loader2, Lock, User, Building2, Moon, Sun } from "lucide-react";

const defaultBackgrounds = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const { login, isAuthenticated } = useSystemAuth();
  const { colorMode, toggleColorMode } = useTheme();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) setLocation("/dashboard");
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    const interval = setInterval(() => setBgIndex((p) => (p + 1) % defaultBackgrounds.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (result.success) {
      setLocation("/dashboard");
    } else {
      setError(result.error || "فشل تسجيل الدخول");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {defaultBackgrounds.map((bg, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg})`, opacity: i === bgIndex ? 1 : 0, transition: "opacity 2s ease-in-out" }}
        />
      ))}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <button
        type="button"
        onClick={toggleColorMode}
        className="absolute z-30 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/25 font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/80 left-4 top-4 h-10 px-3 text-sm"
      >
        {colorMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{colorMode === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
      </button>

      <div className="relative z-10 w-full max-w-lg px-4">
        <Card className="mx-auto max-w-md border-0 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">شركة الأسمدة المتحدة السعودية</h1>
            <p className="text-sm text-muted-foreground mt-1">منصة سحابية متكاملة لإدارة السندات والتقارير والصلاحيات</p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="أدخل اسم المستخدم" className="pr-10 h-11" autoComplete="username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" className="pr-10 h-11" autoComplete="current-password" />
                </div>
              </div>
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">{error}</div>}
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تسجيل الدخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-[11px] text-white/80">
          لتجربة النموذج — المستخدم: <b>admin</b> كلمة المرور: <b>admin123</b> (أو manger / manger123)
        </p>
      </div>
    </div>
  );
}
