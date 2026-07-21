"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useI18nStore } from "@/i18n/store"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const { t } = useI18nStore()

  const toggleTheme = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault(); // Ngăn chặn các sự kiện nổi bọt gây lỗi trên Mobile
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      onTouchEnd={toggleTheme}
      title={t('settings.theme') || "Giao diện"}
      className="relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 z-50 touch-manipulation"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
