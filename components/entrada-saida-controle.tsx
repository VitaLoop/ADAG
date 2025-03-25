"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  ArrowUpDown,
  SlidersHorizontal,
  Filter,
  CalendarIcon,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/format"
import type { Transacao } from "@/types/schema"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

type EntradaSaidaControleProps = {
  transacoesIniciais: Transacao[]
  setTransacoes: (transacoes: Transacao[]) => void
  isAdminMode: boolean
}

export function EntradaSaidaControle({ transacoesIniciais, setTransacoes, isAdminMode }: EntradaSaidaControleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [mesFiltro, setMesFiltro] = useState<string>("")
  const [anoFiltro, setAnoFiltro] = useState<string>(new Date().getFullYear().toString())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transacaoToDelete, setTransacaoToDelete] = useState<string | null>(null)
  const [newTransacao, setNewTransacao] = useState<Partial<Transacao>>({
    tipo: "entrada",
    data: new Date(),
  })
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false)
  const [dataInicioFiltro, setDataInicioFiltro] = useState<Date | undefined>(undefined)
  const [dataFimFiltro, setDataFimFiltro] = useState<Date | undefined>(undefined)
  const [ordenacao, setOrdenacao] = useState<"data" | "valor" | "categoria">("data")
  const [mostrarApenasPositivos, setMostrarApenasPositivos] = useState(false)

  // Gerar anos para o filtro (últimos 5 anos)
  const anos = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    // Gerar anos a partir do atual até 5 anos no futuro
    return Array.from({ length: 6 }, (_, i) => (anoAtual + i).toString())
  }, [])

  // Filtrar transações por mês, ano e termo de busca
  const transacoesFiltradas = useMemo(() => {
    return transacoesIniciais
      .filter((transacao) => {
        const dataTransacao = new Date(transacao.data)
        const mesMatch = mesFiltro ? dataTransacao.getMonth() + 1 === Number.parseInt(mesFiltro) : true
        const anoMatch = anoFiltro ? dataTransacao.getFullYear() === Number.parseInt(anoFiltro) : true
        const searchMatch = searchTerm
          ? transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transacao.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
          : true
        const dataInicioMatch = dataInicioFiltro ? dataTransacao >= dataInicioFiltro : true
        const dataFimMatch = dataFimFiltro ? dataTransacao <= dataFimFiltro : true
        const apenasPositivosMatch = mostrarApenasPositivos ? transacao.tipo === "entrada" : true

        return mesMatch && anoMatch && searchMatch && dataInicioMatch && dataFimMatch && apenasPositivosMatch
      })
      .sort((a, b) => {
        if (ordenacao === "data") {
          return new Date(b.data).getTime() - new Date(a.data).getTime() // Ordena por data descendente
        } else if (ordenacao === "valor") {
          return b.valor - a.valor // Ordena por valor descendente
        } else if (ordenacao === "categoria") {
          return a.categoria.localeCompare(b.categoria) // Ordena por categoria ascendente
        }
        return 0
      })
  }, [
    transacoesIniciais,
    mesFiltro,
    anoFiltro,
    searchTerm,
    dataInicioFiltro,
    dataFimFiltro,
    ordenacao,
    mostrarApenasPositivos,
  ])

  // Calcular totais
  const totais = useMemo(() => {
    const totalEntradas = transacoesFiltradas.filter((t) => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0)

    const totalSaidas = transacoesFiltradas.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
    }
  }, [transacoesFiltradas])

  // Atualizar a função de adição de transação para incrementar estatísticas
  const handleAddTransacao = () => {
    if (
      newTransacao.data &&
      newTransacao.tipo &&
      newTransacao.valor &&
      newTransacao.descricao &&
      newTransacao.categoria &&
      newTransacao.responsavel
    ) {
      const transacaoToAdd: Transacao = {
        id: Date.now().toString(),
        data: newTransacao.data,
        tipo: newTransacao.tipo as "entrada" | "saida",
        valor: Number(newTransacao.valor),
        descricao: newTransacao.descricao,
        categoria: newTransacao.categoria,
        responsavel: newTransacao.responsavel,
        observacoes: newTransacao.observacoes || "",
      }

      setTransacoes([...transacoesIniciais, transacaoToAdd])
      setIsAddDialogOpen(false)
      setNewTransacao({
        tipo: "entrada",
        data: new Date(),
      })

      // Incrementar estatísticas do usuário
      if (typeof window !== "undefined") {
        const userId = JSON.parse(localStorage.getItem("adag_user") || "{}")?.id
        if (userId) {
          // Atualizar XP do usuário (10 XP por transação)
          const userStats = JSON.parse(localStorage.getItem(`adag-stats-${userId}`) || "{}")
          if (userStats) {
            userStats.transactionsCreated = (userStats.transactionsCreated || 0) + 1
            userStats.xp = (userStats.xp || 0) + 10
            localStorage.setItem(`adag-stats-${userId}`, JSON.stringify(userStats))
          }

          // Atualizar conquistas
          const achievements = JSON.parse(localStorage.getItem(`adag-achievements-${userId}`) || "[]")
          if (achievements.length > 0) {
            const transactionAchievement = achievements.find((a: any) => a.id === "2")
            if (transactionAchievement) {
              transactionAchievement.progress = (transactionAchievement.progress || 0) + 1
              transactionAchievement.unlocked =
                transactionAchievement.progress >= (transactionAchievement.maxProgress || 20)
              localStorage.setItem(`adag-achievements-${userId}`, JSON.stringify(achievements))
            }
          }
        }
      }

      toast({
        title: "Transação adicionada",
        description: "A nova transação foi adicionada com sucesso.",
      })
    } else {
      toast({
        title: "Erro ao adicionar",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = () => {
    if (transacaoToDelete) {
      setTransacoes(transacoesIniciais.filter((t) => t.id !== transacaoToDelete))
      setIsDeleteDialogOpen(false)
      setTransacaoToDelete(null)

      toast({
        title: "Transação eliminada",
        description: "A transação foi removida com sucesso.",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // Criar workbook
    const wb = XLSX.utils.book_new()

    // Preparar dados para a planilha principal
    const dadosTransacoes = [
      ["REGISTRO DE TRANSAÇÕES - TESOURARIA ADAG"],
      [""],
      [
        "Período:",
mesFiltro ? `Mês ${getNomeMes(mesFiltro)}` : "Todos os meses",
anoFiltro || new Date().getFullYear(),
      ],
      ["Data de Exportação:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })],
      [""],
      [""],

      ["RESUMO FINANCEIRO"],
      [""],
      ["Total de Entradas:", formatCurrency(totais.entradas)],
      ["Total de Saídas:", formatCurrency(totais.saidas)],
      ["Saldo Atual:", formatCurrency(totais.saldo)],
      [""],
      [""],

      ["TRANSAÇÕES DETALHADAS"],
      [""],
      ["Data", "Tipo", "Valor", "Descrição", "Categoria", "Responsável", "Observações"],
    ]

    // Adicionar cada transação
    transacoesFiltradas.forEach((transacao) => {
      dadosTransacoes.push([
        format(new Date(transacao.data), "dd/MM/yyyy"),
        transacao.tipo === "entrada" ? "Entrada" : "Saída",
        transacao.valor,
        transacao.descricao,
        transacao.categoria,
        transacao.responsavel,
        transacao.observacoes || "",
      ])
    })

    // Criar planilha de transações
    const ws = XLSX.utils.aoa_to_sheet(dadosTransacoes)

    // Ajustar largura das colunas para melhor visualização
    const wscols = [
      { wch: 15 }, // Data
      { wch: 10 }, // Tipo
      { wch: 15 }, // Valor
      { wch: 40 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 20 }, // Responsável
      { wch: 30 }, // Observações
    ]
    ws["!cols"] = wscols

    XLSX.utils.book_append_sheet(wb, ws, "Transações")

    // Exportar arquivo
    const fileName = `Transacoes_${mesFiltro ? getNomeMes(mesFiltro.toString()) : "Todos"}_${anoFiltro || new Date().getFullYear()}.xlsx`;
    XLSX.writeFile(wb, fileName)
    toast({
      title: "Excel exportado",
      description: `O relatório foi exportado como ${fileName} com todos os detalhes.`,
    })
  }

  const handleExportPDF = () => {
    // Criar novo documento PDF
    const doc = new jsPDF()

    // Adicionar título
    doc.setFontSize(18)
    doc.text("Relatório de Transações", 14, 22)

    // Adicionar período
    doc.setFontSize(12)
    const periodoTexto = `Período: ${mesFiltro ? `Mês ${mesFiltro}` : "Todos os meses"} de ${anoFiltro || new Date().getFullYear()}`
    doc.text(periodoTexto, 14, 32)

    // Preparar dados para a tabela
    const tableData = transacoesFiltradas.map((t) => [
      format(new Date(t.data), "dd/MM/yyyy"),
      t.tipo === "entrada" ? "Entrada" : "Saída",
      formatCurrency(t.valor),
      t.descricao,
      t.categoria,
      t.responsavel,
    ])

    // Adicionar tabela
    doc.autoTable({
      startY: 40,
      head: [["Data", "Tipo", "Valor", "Descrição", "Categoria", "Responsável"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [41, 128, 185], textColor: 255 },
      foot: [
        ["", "Total Entradas", formatCurrency(totais.entradas), "", "", ""],
        ["", "Total Saídas", formatCurrency(totais.saidas), "", "", ""],
        ["", "Saldo", formatCurrency(totais.saldo), "", "", ""],
      ],
    })

    // Salvar o PDF
    const fileName = `Transacoes_${mesFiltro || "Todos"}_${anoFiltro || new Date().getFullYear()}.pdf`
    doc.save(fileName)

    toast({
      title: "PDF exportado",
      description: "O relatório foi exportado em formato PDF.",
    })
  }

  const getNomeMes = (numeroMes: string | number): string => {
    // Caso número, converte para string
    const mes = typeof numeroMes === 'number' ? numeroMes.toString() : numeroMes;
  
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    
    return meses[Number.parseInt(mes) - 1]; // Converte para número para pegar o índice
  }
  

  const limparFiltros = () => {
    setSearchTerm("")
    setMesFiltro("")
    setAnoFiltro(new Date().getFullYear().toString())
    setDataInicioFiltro(undefined)
    setDataFimFiltro(undefined)
    setOrdenacao("data")
    setMostrarApenasPositivos(false)
  }

  const toggleOrdenacao = (campo: "data" | "valor" | "categoria") => {
    setOrdenacao(campo)
  }

  return (
    <PrintLayout title="Controle de Entrada/Saída">
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="overflow-hidden border-2 border-green-200 dark:border-green-900 shadow-md dark:shadow-emerald-900/20">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 pb-2 pt-4 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-green-700 dark:text-green-300 text-sm md:text-lg flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5" />
                  <span>Total de Entradas</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
              <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(totais.entradas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transacoesFiltradas.filter((t) => t.tipo === "entrada").length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 border-red-200 dark:border-red-900 shadow-md dark:shadow-red-900/20">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 pb-2 pt-4 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-red-700 dark:text-red-300 text-sm md:text-lg flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5" />
                  <span>Total de Saídas</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
              <div className="text-lg md:text-2xl font-bold text-red-700 dark:text-red-400">
                {formatCurrency(totais.saidas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {transacoesFiltradas.filter((t) => t.tipo === "saida").length} transações
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "overflow-hidden border-2 shadow-md",
              totais.saldo >= 0
                ? "border-blue-200 dark:border-blue-900 dark:shadow-blue-900/20"
                : "border-amber-200 dark:border-amber-900 dark:shadow-amber-900/20",
            )}
          >
            <CardHeader
              className={cn(
                "pb-2 pt-4 px-4 bg-gradient-to-r",
                totais.saldo >= 0
                  ? "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
                  : "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
              )}
            >
              <div className="flex justify-between items-center">
                <CardTitle
                  className={cn(
                    "text-sm md:text-lg flex items-center gap-2",
                    totais.saldo >= 0 ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300",
                  )}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Saldo Atual</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
              <div
                className={cn(
                  "text-lg md:text-2xl font-bold",
                  totais.saldo >= 0 ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400",
                )}
              >
                {formatCurrency(totais.saldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totais.saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e ações */}
        <Card className="border shadow-sm dark:shadow-gray-900/30 overflow-hidden transition-all duration-300">
          <CardHeader className="bg-muted/50 dark:bg-gray-800/50 pb-2 pt-4 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
                  className="text-xs h-8"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                  {filtrosExpandidos ? "Menos filtros" : "Mais filtros"}
                </Button>
                <Button variant="outline" size="sm" onClick={limparFiltros} className="text-xs h-8">
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Filtros básicos sempre visíveis */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar transações..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={mesFiltro} onValueChange={setMesFiltro}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                    <SelectItem key={mes} value={mes.toString()}>
                      {getNomeMes(mes.toString())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Transação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Transação</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes da transação a ser adicionada ao sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select
                            value={newTransacao.tipo}
                            onValueChange={(value) =>
                              setNewTransacao({ ...newTransacao, tipo: value as "entrada" | "saida" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="saida">Saída</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="data">Data</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {newTransacao.data ? (
                                  format(newTransacao.data, "dd/MM/yyyy", { locale: pt })
                                ) : (
                                  <span>Selecionar data</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={newTransacao.data}
                                onSelect={(date) => setNewTransacao({ ...newTransacao, data: date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="valor">Valor (R$)</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newTransacao.valor || ""}
                            onChange={(e) => setNewTransacao({ ...newTransacao, valor: Number(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="categoria">Categoria</Label>
                          <Input
                            id="categoria"
                            placeholder="Ex: Dízimos, Ofertas, Aluguel..."
                            value={newTransacao.categoria || ""}
                            onChange={(e) => setNewTransacao({ ...newTransacao, categoria: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input
                          id="descricao"
                          placeholder="Descrição da transação"
                          value={newTransacao.descricao || ""}
                          onChange={(e) => setNewTransacao({ ...newTransacao, descricao: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="responsavel">Responsável</Label>
                        <Input
                          id="responsavel"
                          placeholder="Nome do responsável"
                          value={newTransacao.responsavel || ""}
                          onChange={(e) => setNewTransacao({ ...newTransacao, responsavel: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="observacoes">Observações (opcional)</Label>
                        <Input
                          id="observacoes"
                          placeholder="Observações adicionais"
                          value={newTransacao.observacoes || ""}
                          onChange={(e) => setNewTransacao({ ...newTransacao, observacoes: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddTransacao}>Adicionar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filtros avançados (expandíveis) */}
            {filtrosExpandidos && (
              <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10"
                          id="dataInicio"
                        >
                          {dataInicioFiltro ? (
                            format(dataInicioFiltro, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span className="text-muted-foreground">Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataInicioFiltro}
                          onSelect={setDataInicioFiltro}
                          initialFocus
                          className="border rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataFim">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10"
                          id="dataFim"
                        >
                          {dataFimFiltro ? (
                            format(dataFimFiltro, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span className="text-muted-foreground">Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataFimFiltro}
                          onSelect={setDataFimFiltro}
                          initialFocus
                          className="border rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2 md:col-span-2">
                    <Label>Ordenação</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={ordenacao === "data" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleOrdenacao("data")}
                        className="flex-1 h-10"
                      >
                        Data
                        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={ordenacao === "valor" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleOrdenacao("valor")}
                        className="flex-1 h-10"
                      >
                        Valor
                        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={ordenacao === "categoria" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleOrdenacao("categoria")}
                        className="flex-1 h-10"
                      >
                        Categoria
                        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2 md:col-span-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mostrarApenasPositivos"
                        checked={mostrarApenasPositivos}
                        onCheckedChange={(checked) => setMostrarApenasPositivos(checked as boolean)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label
                        htmlFor="mostrarApenasPositivos"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mostrar apenas entradas (valores positivos)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de transações - versão desktop */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div className="rounded-md border overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="text-right font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesFiltradas.length > 0 ? (
                  transacoesFiltradas.map((transacao) => (
                    <TableRow
                      key={transacao.id}
                      className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <TableCell>{format(new Date(transacao.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>
                        {transacao.tipo === "entrada" ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800 flex items-center gap-1"
                          >
                            <ArrowUpCircle className="h-3 w-3" />
                            Entrada
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800 flex items-center gap-1"
                          >
                            <ArrowDownCircle className="h-3 w-3" />
                            Saída
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            transacao.tipo === "entrada"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatCurrency(transacao.valor)}
                        </span>
                      </TableCell>
                      <TableCell>{transacao.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full font-normal">
                          {transacao.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>{transacao.responsavel}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                toast({
                                  title: "Detalhes da transação",
                                  description: transacao.observacoes || "Sem observações adicionais",
                                })
                              }}
                            >
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                setTransacaoToDelete(transacao.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma transação encontrada para o período selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Lista de transações - versão mobile */}
        <div className="md:hidden space-y-3 mt-4">
          {transacoesFiltradas.length > 0 ? (
            transacoesFiltradas.map((transacao) => (
              <Card key={transacao.id} className="shadow-sm border border-border/60 dark:border-gray-700/60">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{transacao.descricao}</div>
                      <div className="text-sm text-muted-foreground">{transacao.categoria}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={
                          transacao.tipo === "entrada"
                            ? "text-green-600 dark:text-green-400 font-bold"
                            : "text-red-600 dark:text-red-400 font-bold"
                        }
                      >
                        {formatCurrency(transacao.valor)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transacao.data), "dd/MM/yyyy", { locale: pt })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      {transacao.tipo === "entrada" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800 flex items-center gap-1"
                        >
                          <ArrowUpCircle className="h-3 w-3" />
                          Entrada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800 flex items-center gap-1"
                        >
                          <ArrowDownCircle className="h-3 w-3" />
                          Saída
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Detalhes da transação",
                            description: transacao.observacoes || "Sem observações adicionais",
                          })
                        }}
                      >
                        Detalhes
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setTransacaoToDelete(transacao.id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada para o período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrintLayout>
  )
}

