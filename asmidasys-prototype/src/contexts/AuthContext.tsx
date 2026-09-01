import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthCtx {
  user: any | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login: AuthCtx["login"] = async (username, password) => {
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        isAdmin: user?.userType === "admin",
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSystemAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSystemAuth must be used within AuthProvider");
  return ctx;
}
