"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const THEME_KEY = "tf-theme";

function isDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getSnapshot(): Theme {
  return isDark() ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

const listeners = new Set<() => void>();
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function emit() {
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // localStorage unavailable (SSR / privacy mode) — still toggle in-memory.
    }
    emit();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
      }
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition-colors hover:bg-muted"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}