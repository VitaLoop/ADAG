"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Necessário para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Função para alternar entre temas
  function toggleTheme() {
    console.log("Alternando tema. Tema atual:", resolvedTheme)
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  // Não renderizar nada até que o componente esteja montado
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Alternar tema</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Mudar para modo ${resolvedTheme === "dark" ? "claro" : "escuro"}`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{resolvedTheme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}</span>
    </Button>
  )
}

