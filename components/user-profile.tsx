"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Camera, Trophy, Award, Star, Edit, Key, Save, User, BarChart, FileSpreadsheet, Upload } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type Achievement = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

type UserStats = {
  transactionsCreated: number
  reportsGenerated: number
  sheetsManaged: number
  daysActive: number
  level: number
  xp: number
  nextLevelXp: number
}

type UserProfileProps = {
  updateProfilePhoto?: (photoUrl: string) => void
}

export function UserProfile({ updateProfilePhoto }: UserProfileProps) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("perfil")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialLoadDone = useRef(false)

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: "",
    bio: "Membro da equipe de tesouraria da ADAG Amor Genuíno.",
    photoUrl: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Estatísticas do usuário (inicializadas com valores zerados)
  const [userStats, setUserStats] = useState<UserStats>({
    transactionsCreated: 0,
    reportsGenerated: 0,
    sheetsManaged: 0,
    daysActive: 1, // Primeiro dia de acesso
    level: 1, // Nível inicial
    xp: 0, // XP inicial
    nextLevelXp: 100, // XP necessário para o próximo nível
  })

  // Conquistas (inicializadas como não desbloqueadas)
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "Primeiros Passos",
      description: "Completou o primeiro login no sistema",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      unlocked: true, // Única conquista desbloqueada inicialmente
      progress: 1,
      maxProgress: 1,
    },
    {
      id: "2",
      title: "Gerente Financeiro",
      description: "Registrou mais de 20 transações",
      icon: <BarChart className="h-5 w-5 text-blue-500" />,
      unlocked: false,
      progress: 0,
      maxProgress: 20,
    },
    {
      id: "3",
      title: "Mestre dos Relatórios",
      description: "Gerou mais de 10 relatórios",
      icon: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
      unlocked: false,
      progress: 0,
      maxProgress: 10,
    },
    {
      id: "4",
      title: "Usuário Dedicado",
      description: "Acessou o sistema por 30 dias",
      icon: <Star className="h-5 w-5 text-purple-500" />,
      unlocked: false,
      progress: 1,
      maxProgress: 30,
    },
    {
      id: "5",
      title: "Especialista em Tesouraria",
      description: "Alcançou o nível 5 no sistema",
      icon: <Award className="h-5 w-5 text-red-500" />,
      unlocked: false,
      progress: 1,
      maxProgress: 5,
    },
  ])

  // Carregar dados do usuário do localStorage - APENAS UMA VEZ
  useEffect(() => {
    if (typeof window !== "undefined" && user && !initialLoadDone.current) {
      initialLoadDone.current = true // Marcar como carregado para evitar loops

      // Função para carregar dados do perfil
      const loadProfileData = () => {
        const storedProfileData = localStorage.getItem(`adag-profile-${user.id}`)
        if (storedProfileData) {
          try {
            const parsedData = JSON.parse(storedProfileData)
            setProfileData((prevData) => ({
              ...prevData,
              ...parsedData,
            }))
          } catch (error) {
            console.error("Erro ao analisar dados do perfil:", error)
          }
        }
      }

      // Função para carregar estatísticas
      const loadStats = () => {
        const storedStats = localStorage.getItem(`adag-stats-${user.id}`)
        if (storedStats) {
          try {
            const parsedStats = JSON.parse(storedStats)
            setUserStats(parsedStats)
          } catch (error) {
            console.error("Erro ao analisar estatísticas:", error)
            // Se não conseguir analisar, salvar os valores iniciais
            const defaultStats = {
              transactionsCreated: 0,
              reportsGenerated: 0,
              sheetsManaged: 0,
              daysActive: 1,
              level: 1,
              xp: 0,
              nextLevelXp: 100,
            }
            localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(defaultStats))
          }
        } else {
          // Se não existir, salvar os valores iniciais
          const defaultStats = {
            transactionsCreated: 0,
            reportsGenerated: 0,
            sheetsManaged: 0,
            daysActive: 1,
            level: 1,
            xp: 0,
            nextLevelXp: 100,
          }
          localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(defaultStats))
        }
      }

      // Função para carregar conquistas
      const loadAchievements = () => {
        const storedAchievements = localStorage.getItem(`adag-achievements-${user.id}`)
        if (storedAchievements) {
          try {
            const parsedAchievements = JSON.parse(storedAchievements)

            // Mesclar os dados armazenados com os ícones atuais
            // Importante: NÃO tentamos serializar os ícones React
            const mergedAchievements = parsedAchievements.map((stored: any, index: number) => ({
              ...stored,
              icon: achievements[index]?.icon || null,
            }))

            setAchievements(mergedAchievements)
          } catch (error) {
            console.error("Erro ao analisar conquistas:", error)
            // Se não conseguir analisar, salvar os valores iniciais
            // Remover ícones antes de salvar para evitar referências circulares
            const achievementsWithoutIcons = achievements.map((a) => ({
              ...a,
              icon: null,
            }))
            localStorage.setItem(`adag-achievements-${user.id}`, JSON.stringify(achievementsWithoutIcons))
          }
        } else {
          // Se não existir, salvar os valores iniciais (sem os ícones)
          const achievementsWithoutIcons = achievements.map((a) => ({
            ...a,
            icon: null,
          }))
          localStorage.setItem(`adag-achievements-${user.id}`, JSON.stringify(achievementsWithoutIcons))
        }
      }

      // Executar as funções em sequência para evitar problemas de dependência
      loadProfileData()
      loadStats()
      loadAchievements()

      // Verificar primeiro acesso e acesso diário após carregar os dados
      setTimeout(() => {
        checkFirstAccess()
        checkDailyAccess()
      }, 100)
    }
  }, [user])

  // Função para verificar primeiro acesso - Movida para fora do useEffect
  const checkFirstAccess = () => {
    if (!user) return

    const firstAccessKey = `adag-first-access-${user.id}`
    if (!localStorage.getItem(firstAccessKey)) {
      // Primeiro acesso - conceder XP inicial
      localStorage.setItem(firstAccessKey, new Date().toISOString())

      // Atualizar estatísticas no localStorage primeiro
      const updatedStats = {
        ...userStats,
        xp: 5, // 5 XP pelo primeiro login
      }
      localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(updatedStats))

      // Depois atualizar o estado
      setUserStats((prevStats) => ({
        ...prevStats,
        xp: 5,
      }))
    }
  }

  // Função para verificar acesso diário - Movida para fora do useEffect
  const checkDailyAccess = () => {
    if (!user) return

    const lastAccessKey = `adag-last-access-${user.id}`
    const today = new Date().toDateString()
    const lastAccess = localStorage.getItem(lastAccessKey)

    if (!lastAccess || lastAccess !== today) {
      // Atualizar data de último acesso
      localStorage.setItem(lastAccessKey, today)

      if (lastAccess) {
        // Se não for o primeiro acesso
        // Atualizar estatísticas no localStorage primeiro
        const updatedStats = {
          ...userStats,
          daysActive: userStats.daysActive + 1,
          xp: userStats.xp + 5, // +5 XP por dia de acesso
        }
        localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(updatedStats))

        // Depois atualizar o estado
        setUserStats((prevStats) => ({
          ...prevStats,
          daysActive: prevStats.daysActive + 1,
          xp: prevStats.xp + 5,
        }))

        // Atualizar conquista de dias ativos
        const updatedAchievements = achievements.map((a) => ({ ...a }))
        const dedicatedUserAchievement = updatedAchievements.find((a) => a.id === "4")
        if (dedicatedUserAchievement) {
          dedicatedUserAchievement.progress = userStats.daysActive + 1
          dedicatedUserAchievement.unlocked =
            dedicatedUserAchievement.progress >= (dedicatedUserAchievement.maxProgress || 30)

          // Salvar no localStorage - remover ícones antes de salvar
          const achievementsWithoutIcons = updatedAchievements.map((a) => ({
            ...a,
            icon: null,
          }))
          localStorage.setItem(`adag-achievements-${user.id}`, JSON.stringify(achievementsWithoutIcons))

          // Atualizar estado
          setAchievements(updatedAchievements)
        }
      }
    }
  }

  // Verificar e atualizar nível com base no XP - com controle para evitar loops
  const prevXpRef = useRef(0)
  useEffect(() => {
    if (user && userStats && userStats.xp !== prevXpRef.current) {
      prevXpRef.current = userStats.xp // Atualizar o valor de referência

      // Verificar se o usuário subiu de nível
      const level = Math.floor(userStats.xp / 100) + 1
      const nextLevelXp = level * 100

      if (level !== userStats.level) {
        // Criar uma cópia para evitar mutações diretas
        const updatedStats = {
          ...userStats,
          level,
          nextLevelXp,
        }

        // Atualizar localStorage primeiro
        localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(updatedStats))

        // Atualizar estado local
        setUserStats(updatedStats)

        // Atualizar conquista de nível sem modificar o estado diretamente
        const achievementsCopy = achievements.map((a) => ({ ...a }))
        const levelAchievement = achievementsCopy.find((a) => a.id === "5")

        if (levelAchievement) {
          levelAchievement.progress = level
          levelAchievement.unlocked = level >= (levelAchievement.maxProgress || 5)

          // Salvar no localStorage - remover ícones antes de salvar
          const achievementsWithoutIcons = achievementsCopy.map((a) => ({
            ...a,
            icon: null,
          }))
          localStorage.setItem(`adag-achievements-${user.id}`, JSON.stringify(achievementsWithoutIcons))

          // Atualizar estado
          setAchievements(achievementsCopy)
        }

        // Notificar o usuário
        if (level > userStats.level) {
          toast({
            title: `Parabéns! Você alcançou o nível ${level}`,
            description: "Continue usando o sistema para ganhar mais XP e desbloquear conquistas.",
          })
        }
      }
    }
  }, [user, userStats.xp])

  // Atualizar estatísticas e conquistas com base em ações do usuário
  const prevTransactionsRef = useRef(0)
  const prevReportsRef = useRef(0)
  useEffect(() => {
    if (!user) return

    let shouldUpdateStats = false
    let shouldUpdateAchievements = false
    let updatedStatsData = { ...userStats }
    const updatedAchievementsData = achievements.map((a) => ({ ...a }))

    // Verificar transações apenas se o componente já foi inicializado
    if (initialLoadDone.current) {
      // Carregar transações para calcular estatísticas
      const storedTransactions = localStorage.getItem(`adag-transacoes-${user.id}`)
      if (storedTransactions) {
        try {
          const transactions = JSON.parse(storedTransactions)

          // Só atualizar se o número de transações mudou desde a última verificação
          if (transactions.length !== prevTransactionsRef.current) {
            prevTransactionsRef.current = transactions.length
            shouldUpdateStats = true

            // Atualizar estatísticas baseadas nas transações reais
            updatedStatsData = {
              ...updatedStatsData,
              transactionsCreated: transactions.length,
            }

            // Atualizar conquistas baseadas nas transações
            shouldUpdateAchievements = true
            const financialManagerAchievement = updatedAchievementsData.find((a) => a.id === "2")
            if (financialManagerAchievement) {
              financialManagerAchievement.progress = transactions.length
              financialManagerAchievement.unlocked =
                transactions.length >= (financialManagerAchievement.maxProgress || 20)
            }

            // Atualizar XP baseado nas transações (10 XP por transação)
            const transactionXP = transactions.length * 10
            updatedStatsData.xp = Math.max(updatedStatsData.xp, transactionXP)

            // Calcular nível baseado no XP
            updatedStatsData.level = Math.floor(updatedStatsData.xp / 100) + 1
            updatedStatsData.nextLevelXp = updatedStatsData.level * 100

            // Atualizar conquista de nível
            const levelAchievement = updatedAchievementsData.find((a) => a.id === "5")
            if (levelAchievement) {
              levelAchievement.progress = updatedStatsData.level
              levelAchievement.unlocked = updatedStatsData.level >= (levelAchievement.maxProgress || 5)
            }
          }
        } catch (error) {
          console.error("Erro ao analisar transações:", error)
        }
      }

      // Verificar relatórios gerados (baseado em exportações)
      const reportsGenerated = Number.parseInt(localStorage.getItem(`adag-reports-generated-${user.id}`) || "0", 10)
      if (reportsGenerated > 0 && reportsGenerated !== prevReportsRef.current) {
        prevReportsRef.current = reportsGenerated
        shouldUpdateStats = true
        updatedStatsData = {
          ...updatedStatsData,
          reportsGenerated,
        }

        // Atualizar conquista de relatórios
        shouldUpdateAchievements = true
        const reportsAchievement = updatedAchievementsData.find((a) => a.id === "3")
        if (reportsAchievement) {
          reportsAchievement.progress = reportsGenerated
          reportsAchievement.unlocked = reportsGenerated >= (reportsAchievement.maxProgress || 10)
        }

        // Atualizar XP baseado nos relatórios (15 XP por relatório)
        const reportsXP = reportsGenerated * 15
        updatedStatsData.xp += reportsXP
      }

      // Só atualizar os estados se houver mudanças
      if (shouldUpdateStats) {
        localStorage.setItem(`adag-stats-${user.id}`, JSON.stringify(updatedStatsData))
        setUserStats(updatedStatsData)
      }

      if (shouldUpdateAchievements) {
        // Remover ícones antes de salvar para evitar referências circulares
        const achievementsWithoutIcons = updatedAchievementsData.map((a) => ({
          ...a,
          icon: null,
        }))
        localStorage.setItem(`adag-achievements-${user.id}`, JSON.stringify(achievementsWithoutIcons))

        // Atualizar estado
        setAchievements(updatedAchievementsData)
      }
    }
  }, [user, initialLoadDone.current]) // Verificar apenas quando o usuário muda ou após inicialização

  // Verificar periodicamente por novas transações ou relatórios
  useEffect(() => {
    if (!user) return

    // Configurar um intervalo para verificar atualizações a cada 30 segundos
    const intervalId = setInterval(() => {
      // Recarregar transações e relatórios
      const storedTransactions = localStorage.getItem(`adag-transacoes-${user.id}`)
      if (storedTransactions) {
        try {
          const transactions = JSON.parse(storedTransactions)
          if (transactions.length !== prevTransactionsRef.current) {
            // Forçar uma reavaliação do useEffect anterior
            prevTransactionsRef.current = transactions.length
          }
        } catch (error) {
          console.error("Erro ao verificar transações:", error)
        }
      }

      const reportsGenerated = Number.parseInt(localStorage.getItem(`adag-reports-generated-${user.id}`) || "0", 10)
      if (reportsGenerated !== prevReportsRef.current) {
        prevReportsRef.current = reportsGenerated
      }
    }, 30000) // 30 segundos

    return () => clearInterval(intervalId)
  }, [user])

  // Salvar dados do perfil
  const handleSaveProfile = () => {
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(`adag-profile-${user.id}`, JSON.stringify(profileData))
      setIsEditingProfile(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    }
  }

  // Alterar senha
  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    // Simulação de alteração de senha
    toast({
      title: "Senha alterada",
      description: "Sua senha foi alterada com sucesso.",
    })
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setIsChangingPassword(false)
  }

  // Lidar com a seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Criar URL para preview
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  // Abrir seletor de arquivo
  const handleOpenFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Fazer upload de foto
  const handlePhotoUpload = () => {
    if (!selectedFile && !previewUrl) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    // Se temos um arquivo selecionado, vamos usar a URL do preview
    if (previewUrl) {
      setProfileData({
        ...profileData,
        photoUrl: previewUrl,
      })

      if (typeof window !== "undefined" && user) {
        const updatedProfile = {
          ...profileData,
          photoUrl: previewUrl,
        }
        localStorage.setItem(`adag-profile-${user.id}`, JSON.stringify(updatedProfile))

        // Atualizar a foto no header
        if (updateProfilePhoto) {
          updateProfilePhoto(previewUrl)
        }
      }

      setSelectedFile(null)
      setIsUploadingPhoto(false)
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })
    }
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

  // Calcular progresso de nível
  const levelProgress = userStats ? userStats.xp % 100 : 0 // XP dentro do nível atual

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Perfil do Usuário</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Gerencie suas informações e acompanhe seu progresso
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-9">
            <TabsTrigger value="perfil" className="text-xs md:text-sm">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="conquistas" className="text-xs md:text-sm">
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="text-xs md:text-sm">
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4 md:w-1/3">
                <Avatar className="h-32 w-32 border-2 border-primary">
                  {profileData.photoUrl ? (
                    <AvatarImage src={profileData.photoUrl} alt={profileData.name} />
                  ) : (
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials(profileData.name || user?.name || "")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Dialog open={isUploadingPhoto} onOpenChange={setIsUploadingPhoto}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Alterar Foto</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Foto de Perfil</DialogTitle>
                      <DialogDescription>Selecione uma imagem do seu dispositivo.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col items-center gap-4">
                        {previewUrl ? (
                          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
                            <img
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <Button variant="outline" onClick={handleOpenFileSelector} className="w-full">
                          Selecionar Imagem
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsUploadingPhoto(false)
                          setPreviewUrl(null)
                          setSelectedFile(null)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handlePhotoUpload} disabled={!previewUrl}>
                        Salvar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Nível {userStats.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {userStats.xp}/{userStats.nextLevelXp} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-2 w-full mt-2" />
                </div>
              </div>

              <div className="md:w-2/3">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Input
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-1">
                      <h3 className="text-lg font-semibold">{profileData.name}</h3>
                      <p className="text-sm text-muted-foreground">{profileData.email}</p>
                      {profileData.username && <p className="text-sm text-muted-foreground">@{profileData.username}</p>}
                    </div>
                    <div className="grid gap-1">
                      <h4 className="text-sm font-medium">Biografia</h4>
                      <p className="text-sm">{profileData.bio}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Perfil
                      </Button>
                      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Key className="mr-2 h-4 w-4" />
                            Alterar Senha
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Senha</DialogTitle>
                            <DialogDescription>Crie uma nova senha para sua conta.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="currentPassword">Senha Atual</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="newPassword">Nova Senha</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleChangePassword}>Alterar Senha</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conquistas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border ${
                    achievement.unlocked
                      ? "border-primary/30 dark:border-primary/20 bg-primary/5 dark:bg-primary/10"
                      : "border-border/60 dark:border-gray-700/60 bg-muted/30 dark:bg-gray-800/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        achievement.unlocked ? "bg-primary/10 dark:bg-primary/20" : "bg-muted dark:bg-gray-700"
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.unlocked && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                          >
                            Desbloqueado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                            <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                          </div>
                          <Progress
                            value={(achievement.progress / achievement.maxProgress) * 100}
                            className={`h-1.5 ${
                              achievement.unlocked ? "bg-primary/20 dark:bg-primary/10" : "bg-muted dark:bg-gray-700"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-border/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-primary/20 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <BarChart className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold">{userStats.transactionsCreated}</h3>
                  <p className="text-sm text-muted-foreground text-center">Transações Criadas</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-border/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-primary/20 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold">{userStats.reportsGenerated}</h3>
                  <p className="text-sm text-muted-foreground text-center">Relatórios Gerados</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-border/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-primary/20 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold">{userStats.sheetsManaged}</h3>
                  <p className="text-sm text-muted-foreground text-center">Planilhas Gerenciadas</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-border/60 dark:border-gray-700/60 hover:border-primary/30 dark:hover:border-primary/20 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <User className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-2xl font-bold">{userStats.daysActive}</h3>
                  <p className="text-sm text-muted-foreground text-center">Dias Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Progresso de Nível</h3>
                <p className="text-sm text-muted-foreground">Seu progresso atual no sistema</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">Nível {userStats.level}</h4>
                    <p className="text-sm text-muted-foreground">Próximo nível: {userStats.level + 1}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-medium">{userStats.xp} XP</h4>
                    <p className="text-sm text-muted-foreground">Faltam {userStats.nextLevelXp - userStats.xp} XP</p>
                  </div>
                </div>
                <Progress value={levelProgress} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  <p>Ganhe XP completando ações no sistema:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Registrar transações: +10 XP</li>
                    <li>Gerar relatórios: +15 XP</li>
                    <li>Gerenciar planilhas: +20 XP</li>
                    <li>Login diário: +5 XP</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  )
}

