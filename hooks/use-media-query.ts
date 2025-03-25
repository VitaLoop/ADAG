"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Atualiza o estado com o valor inicial
    setMatches(media.matches)

    // Define um callback para quando o valor mudar
    const listener = () => setMatches(media.matches)

    // Adiciona o listener
    media.addEventListener("change", listener)

    // Remove o listener na limpeza
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}

