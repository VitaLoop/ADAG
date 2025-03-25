"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, LogIn, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AnimatedVerse } from "@/components/animated-verse"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { login, user, resetPassword } = useAuth()

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Verificar se há credenciais salvas
  useEffect(() => {
    const savedEmail = localStorage.getItem("adag_remembered_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validação básica
      if (!email || !password) {
        throw new Error("Por favor, preencha todos os campos")
      }

      // Salvar email se "lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem("adag_remembered_email", email)
      } else {
        localStorage.removeItem("adag_remembered_email")
      }

      // Tenta fazer login
      const success = await login(email, password)

      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema de Tesouraria ADAG",
        })
        router.push("/")
      } else {
        throw new Error("Email ou senha incorretos")
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao fazer login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email para redefinir a senha",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)

    try {
      const success = await resetPassword(resetEmail)

      if (success) {
        toast({
          title: "Redefinição de senha solicitada",
          description: "Verifique seu email para instruções sobre como redefinir sua senha",
        })
        setIsResetDialogOpen(false)
      } else {
        throw new Error("Email não encontrado")
      }
    } catch (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao solicitar redefinição de senha",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-red-950 to-black">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 mb-4">
            {/* Sempre usar a logo branca na tela de login, pois o fundo é escuro */}
            <Image
              src="https://iili.io/3x3McYb.png"
              alt="ADAG Amor Genuíno"
              fill
              className="object-contain drop-shadow-lg"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Tesouraria ADAG</h1>
          <p className="text-sm text-gray-300">Sistema de Gestão Financeira</p>
        </div>

        <AnimatedVerse
          text="Tudo o que temos vem de Deus, e devemos administrar com sabedoria. (1 Crônicas 29:14)"
          className="text-white text-center my-6 px-4 text-sm md:text-base"
        />

        <Card className="bg-black/40 backdrop-blur-sm border-gray-800 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xl">Entrar</CardTitle>
            <CardDescription className="text-gray-300">Acesse sua conta para gerenciar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 h-11"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-white">
                    Senha
                  </Label>
                  <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-red-400 hover:text-red-300">
                        Esqueceu a senha?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">Recuperar Senha</DialogTitle>
                        <DialogDescription className="text-gray-300">
                          Digite seu email para receber instruções de recuperação de senha.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="text-white">
                            Email
                          </Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={isResetting}
                          className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white"
                        >
                          {isResetting ? (
                            <span className="flex items-center justify-center">
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              Enviando...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar Instruções
                            </span>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 pr-10 h-11"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-white/20 text-red-600 focus:ring-red-500"
                />
                <Label htmlFor="remember" className="text-sm text-gray-300">
                  Lembrar meu email
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white h-11 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <div className="text-sm text-gray-300 text-center">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-red-400 hover:text-red-300 font-medium">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

