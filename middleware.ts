import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obter o cookie de autenticação
  const user = request.cookies.get("adag_user")?.value

  // Verificar se o usuário está tentando acessar rotas protegidas
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register")

  // Verificar se o usuário está tentando acessar a página principal
  const isHomePage = request.nextUrl.pathname === "/"

  // Como estamos usando localStorage para autenticação, não podemos verificar o estado de autenticação no middleware
  // Vamos permitir o acesso e deixar a verificação para o lado do cliente

  return NextResponse.next()
}

// Configurar quais rotas o middleware deve ser executado
export const config = {
  matcher: [], // Desativando o middleware por enquanto
}

