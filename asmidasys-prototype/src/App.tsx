import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { useSystemAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UsersManagement from "@/pages/UsersManagement";
import ReceiptsPage from "@/pages/ReceiptsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReportsPage from "@/pages/ReportsPage";
import PerformanceReportsPage from "@/pages/PerformanceReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CustomersPage from "@/pages/CustomersPage";
import TargetsPage from "@/pages/TargetsPage";
import DelegatesPage from "@/pages/DelegatesPage";
import PartnerRightsPage from "@/pages/PartnerRightsPage";
import NotFound from "@/pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSystemAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);
  if (!isAuthenticated) return null;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard">
          <Protected><Dashboard /></Protected>
        </Route>
        <Route path="/users">
          <Protected><UsersManagement /></Protected>
        </Route>
        <Route path="/receipts">
          <Protected><ReceiptsPage /></Protected>
        </Route>
        <Route path="/payments">
          <Protected><PaymentsPage /></Protected>
        </Route>
        <Route path="/reports">
          <Protected><ReportsPage /></Protected>
        </Route>
        <Route path="/performance-reports">
          <Protected><PerformanceReportsPage /></Protected>
        </Route>
        <Route path="/settings">
          <Protected><SettingsPage /></Protected>
        </Route>
        <Route path="/notifications">
          <Protected><NotificationsPage /></Protected>
        </Route>
        <Route path="/customers">
          <Protected><CustomersPage /></Protected>
        </Route>
        <Route path="/targets">
          <Protected><TargetsPage /></Protected>
        </Route>
        <Route path="/delegates">
          <Protected><DelegatesPage /></Protected>
        </Route>
        <Route path="/partner-rights">
          <Protected><PartnerRightsPage /></Protected>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster richColors position="bottom-left" />
    </>
  );
}
