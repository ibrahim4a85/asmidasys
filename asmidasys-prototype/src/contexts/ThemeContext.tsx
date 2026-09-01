import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ColorMode = "light" | "dark";
type Interaction = "azure" | "emerald" | "violet" | "coral" | "amber";

interface ThemeCtx {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (m: ColorMode) => void;
  interaction: Interaction;
  setInteraction: (i: Interaction) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_KEY = "asmidasys-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "light";
  });
  const [interaction, setInteraction] = useState<Interaction>("azure");

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = colorMode;
    localStorage.setItem(THEME_KEY, colorMode);
  }, [colorMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("interaction-azure", "interaction-emerald", "interaction-violet", "interaction-coral", "interaction-amber");
    root.classList.add(`interaction-${interaction}`);
  }, [interaction]);

  const toggleColorMode = () => setColorMode((m) => (m === "dark" ? "light" : "dark"));

  return <Ctx.Provider value={{ colorMode, toggleColorMode, setColorMode, interaction, setInteraction }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
