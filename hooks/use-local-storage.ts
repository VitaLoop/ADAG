"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Inicializar o estado com o valor do localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(parseJSON(item))
      }
    } catch (error) {
      console.log(error)
    }
  }, [key])

  // Função para atualizar o valor no localStorage
  const setValue = (value: T) => {
    try {
      // Salvar o estado
      setStoredValue(value)
      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}

// Função auxiliar para analisar JSON com suporte a datas
function parseJSON<T>(value: string): T {
  return JSON.parse(value, (key, value) => {
    if (typeof value === "string") {
      // Tenta converter strings que parecem datas
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/
      if (dateRegex.test(value)) {
        return new Date(value)
      }
    }
    return value
  })
}

