"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect, useState } from "react"

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Necessário para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Não renderizar nada até que o componente esteja montado
  if (!mounted) {
    return null
  }

  // Usar a logo preta para o tema claro e a logo branca para o tema escuro
  const logoUrl =
    resolvedTheme === "dark"
      ? "https://iili.io/3x3McYb.png" // Logo branca para tema escuro
      : "https://iili.io/3xKVt5u.png" // Logo preta para tema claro

  return (
    <Image
      src={logoUrl || "/placeholder.svg"}
      alt="ADAG Amor Genuíno"
      width={40}
      height={40}
      className={className}
      priority
      unoptimized // Importante para evitar otimização que pode causar problemas
    />
  )
}

