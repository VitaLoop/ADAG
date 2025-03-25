"use client"

import { useState, useEffect } from "react"

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Verificar se estamos no lado do cliente
    if (typeof window !== "undefined") {
      // Função para verificar se é um dispositivo móvel
      const checkMobile = () => {
        const mobileQuery = window.matchMedia("(max-width: 768px)")
        setIsMobile(mobileQuery.matches)
      }

      // Verificar inicialmente
      checkMobile()

      // Adicionar listener para mudanças de tamanho
      const mobileQuery = window.matchMedia("(max-width: 768px)")
      mobileQuery.addEventListener("change", checkMobile)

      // Limpar listener
      return () => mobileQuery.removeEventListener("change", checkMobile)
    }
  }, [])

  return isMobile
}

