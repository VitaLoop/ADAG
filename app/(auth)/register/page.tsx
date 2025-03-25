"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AnimatedVerse } from "@/components/animated-verse"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: dados pessoais, 2: senha
  const { toast } = useToast()
  const router = useRouter()
  const { register, login, user } = useAuth()

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação do primeiro passo
    if (!name || !email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome e email",
        variant: "destructive",
      })
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      })
      return
    }

    setStep(2)
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validação básica
      if (!password || !confirmPassword) {
        throw new Error("Por favor, preencha todos os campos de senha")
      }

      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem")
      }

      if (password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres")
      }

      // Tenta registrar o usuário
      const success = await register(name, email, password)

      if (success) {
        toast({
          title: "Cadastro realizado com sucesso",
          description: "Sua conta foi criada. Você será redirecionado para o painel.",
        })

        // Fazer login automaticamente após o registro
        const loginSuccess = await login(email, password)

        if (loginSuccess) {
          router.push("/")
        } else {
          // Se o login automático falhar, redirecionar para a página de login
          router.push("/login")
        }
      } else {
        throw new Error("Não foi possível criar sua conta. Este email já pode estar em uso.")
      }
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-red-950 to-black">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 mb-4">
            {/* Sempre usar a logo branca na tela de registro, pois o fundo é escuro */}
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
            <CardTitle className="text-white text-xl">Criar Conta</CardTitle>
            <CardDescription className="text-gray-300">
              {step === 1 ? "Informe seus dados pessoais" : "Crie uma senha segura"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 h-11"
                    required
                    autoComplete="name"
                  />
                </div>
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
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white h-11 mt-6"
                >
                  Continuar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 pr-10 h-11"
                      required
                      autoComplete="new-password"
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
                  <p className="text-xs text-gray-400 mt-1">A senha deve ter pelo menos 6 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 h-11"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700 hover:text-white h-11"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Criando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <div className="text-sm text-gray-300 text-center">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

