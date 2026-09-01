import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  UserCircle,
  Target,
  Settings,
  Shield,
  BarChart3,
  LogOut,
  Menu,
  Building2,
  ChevronLeft,
  ChevronDown,
  TrendingUp,
  Bell,
  CheckCheck,
  Moon,
  Sun,
  WalletCards,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSystemAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/lib/api";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  group: "الرئيسية" | "العمليات" | "الإدارة" | "التقارير" | "النظام";
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, path: "/dashboard", group: "الرئيسية" },
  { id: "notifications", label: "سجل الإشعارات", icon: Bell, path: "/notifications", group: "الرئيسية" },
  { id: "receipts", label: "سندات القبض", icon: FileText, path: "/receipts", group: "العمليات" },
  { id: "payments", label: "سندات الصرف", icon: CreditCard, path: "/payments", group: "العمليات" },
  { id: "delegates", label: "التعميدات", icon: Shield, path: "/delegates", group: "العمليات" },
  { id: "customers", label: "إدارة العملاء", icon: UserCircle, path: "/customers", group: "الإدارة" },
  { id: "targets", label: "إدارة الأهداف", icon: Target, path: "/targets", group: "الإدارة" },
  { id: "users", label: "إدارة المستخدمين", icon: Users, path: "/users", group: "الإدارة", adminOnly: true },
  { id: "performance-reports", label: "تقارير الأداء", icon: TrendingUp, path: "/performance-reports", group: "التقارير" },
  { id: "reports", label: "التقارير", icon: BarChart3, path: "/reports", group: "التقارير" },
  { id: "partner-rights", label: "حقوق الشركاء", icon: WalletCards, path: "/partner-rights", group: "التقارير" },
  { id: "settings", label: "إعدادات النظام", icon: Settings, path: "/settings", group: "النظام" },
];
const navGroupOrder: NavItem["group"][] = ["الرئيسية", "العمليات", "الإدارة", "التقارير", "النظام"];

const userTypeLabel = (u: any) =>
  u.userType === "admin" ? "مدير النظام"
    : u.userType === "reviewer" ? "مراجع"
    : u.userType === "authorized_reviewer" ? "مراجع معمد"
    : u.userType === "delegate" ? "مندوب"
    : u.userType === "sales_manager" ? "مدير مبيعات"
    : u.userType === "finance_manager" ? "مدير مالي"
    : u.userType === "authorized_partner" ? "شريك مفوض"
    : u.userType;

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({ الرئيسية: true, العمليات: true, الإدارة: true, التقارير: true, النظام: true });
  const resizeRef = useRef<{ startX: number; width: number } | null>(null);
  const { user, logout, isAdmin, isAuthenticated } = useSystemAuth();
  const { colorMode, toggleColorMode } = useTheme();
  const [location, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.notifications().then(setNotifications).catch(() => {});
    }
  }, [isAuthenticated]);

  const resolvedWidth = sidebarWidth ?? 265;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const stored = Number(localStorage.getItem("app-sidebar-width"));
    setSidebarWidth(Number.isFinite(stored) && stored >= 220 && stored <= 560 ? stored : null);
  }, []);

  useEffect(() => {
    if (sidebarWidth !== null) localStorage.setItem("app-sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const start = resizeRef.current;
      if (!start) return;
      setSidebarWidth(Math.max(220, Math.min(560, Math.round(start.width + (start.startX - e.clientX)))));
    };
    const stop = () => { resizeRef.current = null; setIsResizing(false); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  }, []);

  const startResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (collapsed || window.innerWidth < 1024) return;
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, width: resolvedWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizing(true);
  };

  const markAllRead = () => {
    api.readAllNotifications().then(() => {
      setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    }).catch(() => {});
  };

  const visibleNav = useMemo(() => {
    const list = navItems.filter((i) => (i.adminOnly ? isAdmin : true));
    return list;
  }, [isAdmin]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = location === item.path;
    return (
      <button
        key={item.id}
        onClick={() => { setLocation(item.path); setMobileOpen(false); }}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-right text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-gradient-to-r from-primary to-secondary text-sidebar-primary-foreground shadow-lg"
            : "text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="rtl-page min-h-screen flex bg-gradient-to-b from-background via-background to-muted/20" dir="rtl">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        style={collapsed ? undefined : ({ "--sidebar-width": `${resolvedWidth}px` } as any)}
        className={cn(
          "fixed top-0 right-0 h-full min-h-0 overflow-hidden border-l border-sidebar-border/50 z-50 transition-all duration-300 flex flex-col shadow-xl bg-sidebar",
          collapsed ? "w-[70px]" : "w-[calc(100vw-1.25rem)] max-w-[22rem] lg:w-[var(--sidebar-width)] lg:max-w-none",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {!collapsed && (
          <button type="button" aria-label="اسحب لتغيير عرض القائمة الجانبية" onPointerDown={startResize} className={cn("absolute inset-y-0 left-0 z-20 hidden w-2 cursor-col-resize touch-none border-l border-transparent lg:block", isResizing ? "border-primary bg-primary/20" : "hover:border-primary/70 hover:bg-primary/10")} />
        )}
        <div className="flex min-h-[110px] items-start gap-2 border-b border-sidebar-border px-3 py-3 text-right sm:min-h-[136px] sm:px-2.5 sm:py-4">
          <div className="h-14 w-14 rounded-xl bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 pt-2">
              <h2 className="break-words font-bold leading-6 tracking-[-0.02em] text-sidebar-foreground sm:leading-7" style={{ fontSize: "19px" }}>
                شركة الأسمدة المتحدة السعودية
              </h2>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 [scrollbar-gutter:stable]">
          <nav className="px-1.5 space-y-2">
            {navGroupOrder.map((group) => {
              const items = visibleNav.filter((i) => i.group === group);
              if (!items.length) return null;
              const isOpen = openNavGroups[group] !== false;
              return (
                <div key={group} className="space-y-1">
                  {!collapsed && (
                    <button onClick={() => setOpenNavGroups((c) => ({ ...c, [group]: !isOpen }))} className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-sidebar-foreground/65 hover:bg-sidebar-accent">
                      <span>{group}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90")} />
                    </button>
                  )}
                  {(isOpen || collapsed) && <div className="space-y-1">{items.map(renderNavItem)}</div>}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-sidebar-primary">{user?.fullName?.charAt(0)}</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{user ? userTypeLabel(user) : ""}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="تسجيل الخروج" title="تسجيل الخروج" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors hidden lg:flex"
        >
          <ChevronLeft className={cn("h-3 w-3 text-sidebar-foreground transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      <main style={collapsed ? undefined : ({ "--sidebar-width": `${resolvedWidth}px` } as any)} className={cn("min-w-0 flex-1 min-h-screen flex flex-col transition-all duration-300", collapsed ? "lg:mr-[70px]" : "lg:mr-[var(--sidebar-width)]")}>
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4 gap-3" dir="rtl">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <Button variant="ghost" size="icon" onClick={toggleColorMode} aria-label="تبديل المظهر" title={colorMode === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}>
            {colorMode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen((o) => !o)} aria-label="الإشعارات">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 min-w-4 h-4 rounded-full bg-destructive px-1 text-[9px] leading-4 text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl" dir="rtl">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-bold">الإشعارات</p>
                    <p className="text-[11px] text-muted-foreground">آخر التحديثات على نظامك</p>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                      <CheckCheck className="ml-1 h-3.5 w-3.5" /> تعيين الكل كمقروء
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-muted-foreground">لا توجد إشعارات</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <button key={n.id} onClick={() => setNotificationsOpen(false)} className={cn("w-full border-b border-border/60 px-4 py-3 text-right transition-colors hover:bg-muted/60", !n.isRead && "bg-primary/5")}>
                        <div className="flex items-start gap-2">
                          {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold">{n.title}</p>
                            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{n.message}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("ar-SA")}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5 sm:px-3">
            <UserCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground hidden sm:inline">{user?.fullName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-1 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </header>

        <div className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">{children}</div>
        <footer className="border-t border-border/70 bg-background/70 px-4 py-2.5 text-center text-[10px] text-muted-foreground" dir="rtl">
          <span>© 2026 شركة الأسمدة المتحدة السعودية — النموذج التفاعلي مطابق لتصميم asmidasys</span>
          <span className="mx-2 text-border">|</span>
          <span>مصمم النظام - ابراهيم مقبل</span>
        </footer>
      </main>
    </div>
  );
}
