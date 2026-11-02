import { useState, useEffect, useLayoutEffect } from "react";
import type { ThemePreference, ResolvedTheme } from "../settings/types";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

export function useTheme(
  preference: ThemePreference,
  isAuthenticated: boolean
): ResolvedTheme {
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(DARK_MEDIA_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    setSystemDark(mql.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    } else if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(handleChange);
      return () => (mql as any).removeListener(handleChange);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = !isAuthenticated
    ? "light"
    : preference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : preference === "dark"
        ? "dark"
        : "light";

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return resolvedTheme;
}

