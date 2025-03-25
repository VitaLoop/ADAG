"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { EntradaSaidaControle } from "@/components/entrada-saida-controle"
import { RelatorioGeral } from "@/components/relatorio-geral"
// Remover a importação do componente DadosPlanilha
// import { DadosPlanilha } from "@/components/dados-planilha"
import { UserProfile } from "@/components/user-profile"
import { Footer } from "@/components/footer"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transacao, Planilha, User } from "@/types/schema"
import { Menu, LogOut, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Home() {
  // Modificar o estado activeTab para não incluir "dados-planilha"
  const [activeTab, setActiveTab] = useState("entrada-saida")
  const [isAdminMode, setIsAdminMode] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  // Estado para verificar se estamos no lado do cliente
  const [isClient, setIsClient] = useState(false)

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Usar o ID do usuário como parte da chave de armazenamento para isolar os dados
  const userKey = user?.id || "guest"

  // Inicializar com valores vazios e atualizar quando tivermos acesso ao localStorage
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [planilhas, setPlanilhas] = useState<Planilha[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Estado para armazenar a foto do perfil
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  // Carregar dados do localStorage quando estivermos no cliente e tivermos um usuário
  useEffect(() => {
    if (isClient && user) {
      try {
        // Carregar transações
        const storedTransacoes = localStorage.getItem(`adag-transacoes-${userKey}`)
        if (storedTransacoes) {
          setTransacoes(JSON.parse(storedTransacoes))
        } else {
          // Inicializar com dados padrão
          setTransacoes([]) // Iniciar vazio em vez de usar dados iniciais
          localStorage.setItem(`adag-transacoes-${userKey}`, JSON.stringify([]))
        }

        // Carregar planilhas
        const storedPlanilhas = localStorage.getItem(`adag-planilhas-${userKey}`)
        if (storedPlanilhas) {
          setPlanilhas(JSON.parse(storedPlanilhas))
        } else {
          // Inicializar com dados padrão
          setPlanilhas([]) // Iniciar vazio em vez de usar dados iniciais
          localStorage.setItem(`adag-planilhas-${userKey}`, JSON.stringify([]))
        }

        // Carregar usuários
        const storedUsers = localStorage.getItem(`adag-users-${userKey}`)
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers))
        } else {
          // Inicializar com dados padrão
          setUsers([]) // Iniciar vazio em vez de usar dados iniciais
          localStorage.setItem(`adag-users-${userKey}`, JSON.stringify([]))
        }

        // Carregar foto do perfil
        const storedProfileData = localStorage.getItem(`adag-profile-${userKey}`)
        if (storedProfileData) {
          const profileData = JSON.parse(storedProfileData)
          setProfilePhoto(profileData.photoUrl || null)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
  }, [isClient, user, userKey])

  // Salvar alterações no localStorage
  const updateTransacoes = (newTransacoes: Transacao[]) => {
    setTransacoes(newTransacoes)
    if (isClient && user) {
      localStorage.setItem(`adag-transacoes-${userKey}`, JSON.stringify(newTransacoes))
    }
  }

  const updatePlanilhas = (newPlanilhas: Planilha[]) => {
    setPlanilhas(newPlanilhas)
    if (isClient && user) {
      localStorage.setItem(`adag-planilhas-${userKey}`, JSON.stringify(newPlanilhas))
    }
  }

  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers)
    if (isClient && user) {
      localStorage.setItem(`adag-users-${userKey}`, JSON.stringify(newUsers))
    }
  }

  // Função para atualizar a foto do perfil
  const updateProfilePhoto = (photoUrl: string) => {
    setProfilePhoto(photoUrl)
  }

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (isClient && !isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router, isClient])

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (isLoading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não renderizar nada se não estiver autenticado
  if (!user) {
    return null
  }

  // Obter iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => {
                    const event = new CustomEvent("toggle-sidebar")
                    document.dispatchEvent(event)
                  }}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              )}
              <h1 className="text-lg font-semibold md:text-xl">Tesouraria ADAG</h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 relative">
                    <Avatar className="h-8 w-8">
                      {profilePhoto ? (
                        <AvatarImage src={profilePhoto} alt={user.name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{user.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center text-xs text-muted-foreground">
                    <span className="flex-1 truncate ml-6">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab("user-profile")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Ver Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModeToggle />
            </div>
          </header>

          {/* Removido o container mx-auto max-w-7xl para permitir largura total */}
          <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 md:pb-6 w-full">
            {activeTab === "entrada-saida" && (
              <Card className="shadow-sm border-0 md:border w-full">
                <CardHeader className="px-3 py-2 md:px-6 md:py-4">
                  <CardTitle className="text-lg md:text-2xl font-bold">Controle de Entrada/Saída</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Sistema de gestão e monitorização de Entradas e Saídas para a igreja ADAG Amor Genuíno
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <EntradaSaidaControle
                    transacoesIniciais={transacoes}
                    setTransacoes={updateTransacoes}
                    isAdminMode={isAdminMode}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === "relatorio-geral" && (
              <Card className="shadow-sm border-0 md:border w-full">
                <CardHeader className="px-3 py-2 md:px-6 md:py-4">
                  <CardTitle className="text-lg md:text-xl">Relatório Geral</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Visão geral das finanças da igreja</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <RelatorioGeral transacoes={transacoes} />
                </CardContent>
              </Card>
            )}

            {/* Remover a seção de dados-planilha do renderizado */}
            {/* Remover este bloco:
            {/* {activeTab === "dados-planilha" && (
              <Card className="shadow-sm border-0 md:border w-full">
                <CardHeader className="px-3 py-2 md:px-6 md:py-4">
                  <CardTitle className="text-lg md:text-xl">Dados Planilha</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Gerencie os dados financeiros mensais
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                  <DadosPlanilha
                    planilhasIniciais={planilhas}
                    setPlanilhas={updatePlanilhas}
                    isAdminMode={isAdminMode}
                  />
                </CardContent>
              </Card>
            )} */}

            {activeTab === "user-profile" && <UserProfile updateProfilePhoto={updateProfilePhoto} />}
          </main>

          <Footer className="hidden md:block" />

          {/* Navegação inferior para dispositivos móveis */}
          <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </SidebarProvider>
  )
}

