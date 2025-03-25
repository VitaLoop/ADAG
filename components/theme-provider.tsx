"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Forçar a aplicação do tema no lado do cliente
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

