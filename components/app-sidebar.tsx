"use client"

import { useEffect } from "react"
import { BarChart3, LayoutDashboard, User, X } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"

type AppSidebarProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { setOpen, open } = useSidebar()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Fechar a sidebar automaticamente em dispositivos móveis
  useEffect(() => {
    if (!isDesktop) {
      setOpen(false)
    } else {
      setOpen(true)
    }
  }, [isDesktop, setOpen])

  // Adicionar listener para o evento de toggle da sidebar
  useEffect(() => {
    const handleToggleSidebar = () => {
      setOpen(!open)
    }

    document.addEventListener("toggle-sidebar", handleToggleSidebar)

    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar)
    }
  }, [open, setOpen])

  // Fechar a sidebar ao clicar em um item do menu em dispositivos móveis
  const handleMenuClick = (tab: string) => {
    setActiveTab(tab)
    if (!isDesktop) {
      setOpen(false)
    }
  }

  return (
    <Sidebar className="z-30">
      <SidebarHeader className="border-b py-4">
        <div className="flex items-center px-4">
          <Logo className="h-8 w-auto" />
          <span className="ml-2 text-xl font-bold">ADAG</span>
          {!isDesktop && open && (
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar menu</span>
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "entrada-saida"}
              onClick={() => handleMenuClick("entrada-saida")}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Entrada/Saída</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "relatorio-geral"}
              onClick={() => handleMenuClick("relatorio-geral")}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Relatório Geral</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeTab === "user-profile"} onClick={() => handleMenuClick("user-profile")}>
              <User className="h-5 w-5" />
              <span>Meu Perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-center">
          <span className="text-sm text-muted-foreground">ADAG Amor Genuíno</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

