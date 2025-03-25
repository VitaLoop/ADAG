"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedVerseProps {
  text: string
  className?: string
  typingSpeed?: number
  startDelay?: number
}

export function AnimatedVerse({ text, className, typingSpeed = 40, startDelay = 500 }: AnimatedVerseProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const verseRef = useRef<HTMLDivElement>(null)

  // Detectar quando o componente está visível na tela
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (verseRef.current) {
      observer.observe(verseRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Efeito de digitação
  useEffect(() => {
    let timeout: NodeJS.Timeout

    // Só começar a digitar quando o componente estiver visível
    if (!isVisible) return

    // Delay inicial antes de começar a digitar
    if (currentIndex === 0) {
      timeout = setTimeout(() => {
        startTyping()
      }, startDelay)
      return () => clearTimeout(timeout)
    }

    function startTyping() {
      if (currentIndex < text.length) {
        timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + text[currentIndex])
          setCurrentIndex((prev) => prev + 1)
        }, typingSpeed)
      } else {
        setIsTyping(false)
      }
    }

    if (isTyping) {
      startTyping()
    }

    return () => clearTimeout(timeout)
  }, [currentIndex, isTyping, text, typingSpeed, startDelay, isVisible])

  return (
    <div
      ref={verseRef}
      className={cn(
        "relative bg-black/30 p-4 rounded-lg shadow-inner backdrop-blur-sm border border-red-900/30",
        className,
      )}
    >
      <p className="relative font-normal">
        <span className="text-red-400 text-lg mr-1">"</span>
        {displayedText}
        {isTyping && <span className="inline-block w-1 h-4 ml-0.5 bg-red-500 animate-pulse">&nbsp;</span>}
        {!isTyping && <span className="text-red-400 text-lg ml-1">"</span>}
      </p>
    </div>
  )
}

