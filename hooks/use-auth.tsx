"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { dadosIniciais } from "@/data/dados-iniciais"

// Tipo para o usuário
interface User {
  id: string
  name: string
  email: string
  role: string
}

// Tipo para o contexto de autenticação
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  resetPassword: (email: string) => Promise<boolean>
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar se estamos no lado do cliente
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("adag_user")

          if (storedUser) {
            setUser(JSON.parse(storedUser))
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        // Em caso de erro, limpar o estado de autenticação
        if (typeof window !== "undefined") {
          localStorage.removeItem("adag_user")
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Função para login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Verificar se estamos no lado do cliente
      if (typeof window === "undefined") {
        return false
      }

      // Buscar usuários do localStorage
      const usersJson = localStorage.getItem("adag_users")

      // Se não existirem usuários, criar o primeiro usuário admin
      if (!usersJson) {
        // Criar usuário admin padrão se não existir nenhum usuário
        const adminUser = {
          id: "admin-1",
          name: "Administrador",
          email: "admin@adag.org",
          password: "admin123",
          role: "admin",
          isActive: true,
          dateCreated: new Date().toISOString(),
        }

        localStorage.setItem("adag_users", JSON.stringify([adminUser]))

        // Verificar se as credenciais correspondem ao admin padrão
        if (email === adminUser.email && password === adminUser.password) {
          const loggedUser = {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
          }

          localStorage.setItem("adag_user", JSON.stringify(loggedUser))
          setUser(loggedUser)

          // Inicializar dados do usuário
          initializeUserData(adminUser.id)

          return true
        }

        return false
      }

      // Verificar usuários existentes
      const users = JSON.parse(usersJson)

      // Verificar se o usuário existe
      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)

      if (foundUser) {
        // Criar objeto de usuário sem a senha
        const loggedUser = {
          id: foundUser.id,
          name: foundUser.name || foundUser.fullName,
          email: foundUser.email,
          role: foundUser.role,
        }

        // Salvar no localStorage e no estado
        localStorage.setItem("adag_user", JSON.stringify(loggedUser))

        // Registrar data do último login
        const updatedUsers = users.map((u: any) => {
          if (u.id === foundUser.id) {
            return {
              ...u,
              lastLogin: new Date().toISOString(),
            }
          }
          return u
        })

        localStorage.setItem("adag_users", JSON.stringify(updatedUsers))

        // Verificar se o usuário já tem dados inicializados
        if (!localStorage.getItem(`adag-transacoes-${foundUser.id}`)) {
          initializeUserData(foundUser.id)
        }

        // Atualizar estado
        setUser(loggedUser)
        return true
      }

      return false
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      return false
    }
  }

  // Função para registro
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Verificar se estamos no lado do cliente
      if (typeof window === "undefined") {
        return false
      }

      // Buscar usuários existentes
      const usersJson = localStorage.getItem("adag_users")
      const users = usersJson ? JSON.parse(usersJson) : []

      // Verificar se o email já está em uso
      const emailExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())

      if (emailExists) {
        return false
      }

      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        name,
        fullName: name,
        email,
        password,
        role: users.length === 0 ? "admin" : "viewer", // Primeiro usuário é admin
        isActive: true,
        dateCreated: new Date().toISOString(),
        lastLogin: null,
      }

      // Adicionar à lista de usuários
      users.push(newUser)
      localStorage.setItem("adag_users", JSON.stringify(users))

      // Inicializar dados do usuário
      initializeUserData(newUser.id)

      // Criar objeto de usuário para login automático
      const loggedUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }

      // Salvar no localStorage e no estado para login automático
      localStorage.setItem("adag_user", JSON.stringify(loggedUser))
      setUser(loggedUser)

      return true
    } catch (error) {
      console.error("Erro ao registrar usuário:", error)
      return false
    }
  }

  // Função para redefinir senha
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // Verificar se estamos no lado do cliente
      if (typeof window === "undefined") {
        return false
      }

      // Buscar usuários existentes
      const usersJson = localStorage.getItem("adag_users")
      if (!usersJson) {
        return false
      }

      const users = JSON.parse(usersJson)

      // Verificar se o usuário existe
      const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase())

      if (userIndex === -1) {
        return false
      }

      // Gerar nova senha temporária
      const tempPassword = Math.random().toString(36).slice(-8)

      // Atualizar senha do usuário
      users[userIndex].password = tempPassword
      users[userIndex].passwordReset = true

      // Salvar usuários atualizados
      localStorage.setItem("adag_users", JSON.stringify(users))

      // Em um sistema real, aqui enviaria um email com a senha temporária
      // Para fins de demonstração, vamos apenas mostrar a senha no console
      console.log(`Nova senha para ${email}: ${tempPassword}`)

      return true
    } catch (error) {
      console.error("Erro ao redefinir senha:", error)
      return false
    }
  }

  // Inicializar dados do usuário
  const initializeUserData = (userId: string) => {
    try {
      // Inicializar transações
      localStorage.setItem(`adag-transacoes-${userId}`, JSON.stringify(dadosIniciais.transacoes))

      // Inicializar planilhas
      localStorage.setItem(`adag-planilhas-${userId}`, JSON.stringify(dadosIniciais.planilhas))

      // Inicializar usuários do sistema
      localStorage.setItem(`adag-users-${userId}`, JSON.stringify(dadosIniciais.users))

      // Inicializar estatísticas
      const initialStats = {
        transactionsCreated: 0,
        reportsGenerated: 0,
        sheetsManaged: 0,
        daysActive: 1,
        level: 1,
        xp: 0,
        nextLevelXp: 100,
      }
      localStorage.setItem(`adag-stats-${userId}`, JSON.stringify(initialStats))

      // Inicializar conquistas
      const initialAchievements = [
        {
          id: "1",
          title: "Primeiros Passos",
          description: "Completou o primeiro login no sistema",
          unlocked: true,
          progress: 1,
          maxProgress: 1,
        },
        {
          id: "2",
          title: "Gerente Financeiro",
          description: "Registrou mais de 20 transações",
          unlocked: false,
          progress: 0,
          maxProgress: 20,
        },
        {
          id: "3",
          title: "Mestre dos Relatórios",
          description: "Gerou mais de 10 relatórios",
          unlocked: false,
          progress: 0,
          maxProgress: 10,
        },
        {
          id: "4",
          title: "Usuário Dedicado",
          description: "Acessou o sistema por 30 dias",
          unlocked: false,
          progress: 1,
          maxProgress: 30,
        },
        {
          id: "5",
          title: "Especialista em Tesouraria",
          description: "Alcançou o nível 5 no sistema",
          unlocked: false,
          progress: 1,
          maxProgress: 5,
        },
      ]
      localStorage.setItem(`adag-achievements-${userId}`, JSON.stringify(initialAchievements))
    } catch (error) {
      console.error("Erro ao inicializar dados do usuário:", error)
    }
  }

  // Função para logout
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adag_user")
    }
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }

  return context
}

