export type Transacao = {
  id: string
  data: Date
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
  categoria: string
  responsavel: string
  observacoes?: string
}

export type Planilha = {
  id: string
  mes: number
  ano: number
  historico: string
  entradas: number
  saidas: number
  saldo: number
  data: Date
}

export type User = {
  id: string
  username: string
  email: string
  fullName: string
  role: "admin" | "editor" | "viewer"
  password: string
  isActive: boolean
  dateCreated: Date
  lastLogin?: Date
}

export type Pagamento = {
  id: string
  referencia: string
  fornecedor: string
  valor: number
  dataVencimento: Date
  dataPagamento: Date | null
  estado: "pendente" | "pago" | "atrasado" | "cancelado"
  metodo: "transferência" | "cheque" | "débito direto" | "outro"
  departamento: string
  observacoes: string
}

export type Cheque = {
  id: string
  numero: string
  valor: number
  beneficiario: string
  dataEmissao: Date
  dataCompensacao: Date | null
  estado: "pendente" | "compensado"
}

export type Movimento = {
  id: string
  data: Date
  tipo: "entrada" | "saida"
  valor: number
  descricao: string
}

