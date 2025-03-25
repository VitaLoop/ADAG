"use client"

import { BarChart3, LayoutDashboard, User } from "lucide-react"
import { cn } from "@/lib/utils"

type MobileBottomNavProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveTab("entrada-saida")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            activeTab === "entrada-saida" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs mt-1">Entrada/Saída</span>
        </button>
        <button
          onClick={() => setActiveTab("relatorio-geral")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            activeTab === "relatorio-geral" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs mt-1">Relatório</span>
        </button>
        <button
          onClick={() => setActiveTab("user-profile")}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            activeTab === "user-profile" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </div>
  )
}

