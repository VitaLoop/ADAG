"use client"

import { useState, useMemo } from "react"
import { PrintLayout } from "@/components/print-layout"
import { Printer, FileDown, Filter, CalendarIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transacao } from "@/types/schema"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { toast } from "@/components/ui/use-toast"

type RelatorioGeralProps = {
  transacoes: Transacao[]
}

export function RelatorioGeral({ transacoes }: RelatorioGeralProps) {
  const [anoFiltro, setAnoFiltro] = useState<string>(new Date().getFullYear().toString())
  const [mesFiltro, setMesFiltro] = useState<string>("todos")
  const [dataInicioFiltro, setDataInicioFiltro] = useState<Date | undefined>(undefined)
  const [dataFimFiltro, setDataFimFiltro] = useState<Date | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")

  // Gerar anos para o filtro (a partir do atual até 5 anos no futuro)
  const anos = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => (anoAtual + i).toString())
  }, [])

  // Filtrar transações
  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((transacao) => {
        const dataTransacao = new Date(transacao.data)

        // Filtro por ano
        const anoMatch = anoFiltro === "todos" ? true : dataTransacao.getFullYear().toString() === anoFiltro

        // Filtro por mês
        const mesMatch = mesFiltro === "todos" ? true : dataTransacao.getMonth() + 1 === Number.parseInt(mesFiltro)

        // Filtro por data de início
        const dataInicioMatch = !dataInicioFiltro ? true : dataTransacao >= dataInicioFiltro

        // Filtro por data de fim
        const dataFimMatch = !dataFimFiltro ? true : dataTransacao <= dataFimFiltro

        // Filtro por termo de pesquisa
        const searchMatch = !searchTerm
          ? true
          : transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transacao.responsavel.toLowerCase().includes(searchTerm.toLowerCase())

        return anoMatch && mesMatch && dataInicioMatch && dataFimMatch && searchMatch
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Ordenar por data (mais recente primeiro)
  }, [transacoes, anoFiltro, mesFiltro, dataInicioFiltro, dataFimFiltro, searchTerm])

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

  const handlePrint = () => {
    window.print()
  }

  // Exportação para Excel com detalhes completos
  const handleExportExcel = () => {
    // Preparar dados para exportação com detalhes completos
    const dataToExport = [
      // Cabeçalho com informações do relatório
      ["RELATÓRIO DETALHADO DE TRANSAÇÕES - TESOURARIA ADAG"],
      [""],
      ["Período:", getDescricaoPeriodo()],
      ["Data de Exportação:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })],
      [""],
      [""],

      // Resumo Financeiro
      ["RESUMO FINANCEIRO"],
      [""],
      ["Total de Entradas", formatCurrency(totais.entradas)],
      ["Total de Saídas", formatCurrency(totais.saidas)],
      ["Saldo", formatCurrency(totais.saldo)],
      [""],
      [""],

      // Lista detalhada de transações
      ["TRANSAÇÕES DETALHADAS"],
      [""],
      ["Data", "Tipo", "Valor", "Descrição", "Categoria", "Responsável", "Método de Pagamento", "Observações"],
    ]

// Adicionar cada transação com todos os detalhes disponíveis
transacoesFiltradas.forEach((t) => {
  dataToExport.push([
    format(new Date(t.data), "dd/MM/yyyy"),
    t.tipo === "entrada" ? "Entrada" : "Saída",
    t.valor.toString(), // Aqui convertemos o número para string
    t.descricao,
    t.categoria,
    t.responsavel,
    t.observacoes || "",
  ]);
});



    // Criar planilha
    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transações Detalhadas")

    // Ajustar largura das colunas para melhor visualização
    const wscols = [
      { wch: 15 }, // Data
      { wch: 10 }, // Tipo
      { wch: 15 }, // Valor
      { wch: 40 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 20 }, // Responsável
      { wch: 20 }, // Método de Pagamento
      { wch: 40 }, // Observações
    ]
    ws["!cols"] = wscols

    // Exportar arquivo
    XLSX.writeFile(wb, `Transacoes_Detalhadas_${getDescricaoPeriodo().replace(/[/\\:*?"<>|]/g, "_")}.xlsx`)

    // Incrementar contador de relatórios gerados para estatísticas
    if (typeof window !== "undefined") {
      const userId = JSON.parse(localStorage.getItem("adag_user") || "{}")?.id
      if (userId) {
        const reportsGenerated = Number.parseInt(localStorage.getItem(`adag-reports-generated-${userId}`) || "0", 10)
        localStorage.setItem(`adag-reports-generated-${userId}`, (reportsGenerated + 1).toString())

        // Atualizar XP do usuário (15 XP por relatório)
        const userStats = JSON.parse(localStorage.getItem(`adag-stats-${userId}`) || "{}")
        if (userStats) {
          userStats.reportsGenerated = (userStats.reportsGenerated || 0) + 1
          userStats.xp = (userStats.xp || 0) + 15
          localStorage.setItem(`adag-stats-${userId}`, JSON.stringify(userStats))
        }

        // Atualizar conquistas
        const achievements = JSON.parse(localStorage.getItem(`adag-achievements-${userId}`) || "[]")
        if (achievements.length > 0) {
          const reportsAchievement = achievements.find((a: any) => a.id === "3")
          if (reportsAchievement) {
            reportsAchievement.progress = (reportsAchievement.progress || 0) + 1
            reportsAchievement.unlocked = reportsAchievement.progress >= (reportsAchievement.maxProgress || 10)
            localStorage.setItem(`adag-achievements-${userId}`, JSON.stringify(achievements))
          }
        }
      }
    }

    toast({
      title: "Excel exportado",
      description: "O relatório detalhado foi exportado com sucesso.",
    })
  }

  // Exportação para PDF com detalhes
  const handleExportPDF = () => {
    // Criar novo documento PDF
    const doc = new jsPDF()

    // Adicionar título
    doc.setFontSize(18)
    doc.text("Relatório Detalhado de Transações", 14, 22)

    // Adicionar período
    doc.setFontSize(12)
    doc.text(`Período: ${getDescricaoPeriodo()}`, 14, 32)

    // Adicionar resumo
    doc.setFontSize(14)
    doc.text("Resumo Financeiro", 14, 45)

    doc.setFontSize(12)
    doc.text(`Total de Entradas: ${formatCurrency(totais.entradas)}`, 20, 55)
    doc.text(`Total de Saídas: ${formatCurrency(totais.saidas)}`, 20, 62)
    doc.text(`Saldo: ${formatCurrency(totais.saldo)}`, 20, 69)

    // Preparar dados para a tabela
    const tableData = transacoesFiltradas.map((t) => [
      format(new Date(t.data), "dd/MM/yyyy"),
      t.tipo === "entrada" ? "Entrada" : "Saída",
      formatCurrency(t.valor),
      t.descricao,
      t.categoria,
      t.responsavel,
      t.observacoes || "",
    ])

    // Adicionar tabela de transações
    doc.setFontSize(14)
    doc.text("Transações Detalhadas", 14, 82)

    doc.autoTable({
      startY: 85,
      head: [["Data", "Tipo", "Valor", "Descrição", "Categoria", "Responsável", "Observações"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    })

    // Salvar o PDF
    doc.save(`Transacoes_Detalhadas_${getDescricaoPeriodo().replace(/[/\\:*?"<>|]/g, "_")}.pdf`)

    toast({
      title: "PDF exportado",
      description: "O relatório detalhado foi exportado em formato PDF.",
    })
  }

  // Função para obter descrição do período para relatórios
  const getDescricaoPeriodo = () => {
    let descricao = ""

    if (dataInicioFiltro && dataFimFiltro) {
      descricao = `${format(dataInicioFiltro, "dd/MM/yyyy")} a ${format(dataFimFiltro, "dd/MM/yyyy")}`
    } else if (mesFiltro !== "todos" && anoFiltro !== "todos") {
      const nomeMes = getNomeMes(Number.parseInt(mesFiltro))
      descricao = `${nomeMes}/${anoFiltro}`
    } else if (mesFiltro !== "todos") {
      descricao = `${getNomeMes(Number.parseInt(mesFiltro))}`
    } else if (anoFiltro !== "todos") {
      descricao = anoFiltro
    } else {
      descricao = "Todo o período"
    }

    return descricao
  }

  const getNomeMes = (numeroMes: number) => {
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
    ]
    return meses[numeroMes - 1]
  }

  // Limpar todos os filtros
  const limparFiltros = () => {
    setAnoFiltro("todos")
    setMesFiltro("todos")
    setDataInicioFiltro(undefined)
    setDataFimFiltro(undefined)
    setSearchTerm("")
  }

  return (
    <PrintLayout title="Relatório Detalhado">
      <div className="space-y-6">
        {/* Cabeçalho com título e botões de ação */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Relatório Detalhado</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Exporte dados detalhados de todas as transações</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportExcel}
              className="print:hidden h-9 px-2 md:px-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white"
            >
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Excel</span>
            </Button>

            <Button
              onClick={handleExportPDF}
              className="print:hidden h-9 px-2 md:px-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
            >
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">PDF</span>
            </Button>

            <Button onClick={handlePrint} className="print:hidden h-9 px-2 md:px-3">
              <Printer className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Imprimir</span>
            </Button>
          </div>
        </div>

        {/* Filtros simples */}
        <Card className="border shadow-sm dark:shadow-gray-900/30">
          <CardHeader className="bg-muted/50 dark:bg-gray-800/50 pb-2 pt-4 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={limparFiltros} className="text-xs h-8">
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar transações..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                <SelectTrigger id="anoFiltro" className="h-10">
                  <SelectValue placeholder="Selecionar ano" />
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

              <Select value={mesFiltro} onValueChange={setMesFiltro}>
                <SelectTrigger id="mesFiltro" className="h-10">
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                    <SelectItem key={mes} value={mes.toString()}>
                      {getNomeMes(mes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dataInicio" className="sr-only">
                    Data Inicial
                  </Label>
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
                          <span className="text-muted-foreground">Data inicial</span>
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

                <div>
                  <Label htmlFor="dataFim" className="sr-only">
                    Data Final
                  </Label>
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
                          <span className="text-muted-foreground">Data final</span>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo simples */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                  {formatCurrency(totais.entradas)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
                  {formatCurrency(totais.saidas)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Saldo</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                  {formatCurrency(totais.saldo)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de transações */}
        <Card className="border shadow-sm dark:shadow-gray-900/30">
          <CardHeader className="bg-muted/50 dark:bg-gray-800/50 pb-2 pt-4 px-4">
            <CardTitle className="text-sm md:text-base">Transações ({transacoesFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="text-right font-semibold">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.length > 0 ? (
                    transacoesFiltradas.map((transacao) => (
                      <TableRow
                        key={transacao.id}
                        className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <TableCell>{format(new Date(transacao.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          {transacao.tipo === "entrada" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                            >
                              Entrada
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800"
                            >
                              Saída
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{transacao.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full font-normal">
                            {transacao.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>{transacao.responsavel}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transacao.tipo === "entrada"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(transacao.valor)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma transação encontrada para o período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Nota informativa */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Use os botões acima para exportar este relatório detalhado em Excel ou PDF.
            <br />
            Os relatórios exportados contêm informações adicionais como observações e métodos de pagamento.
          </p>
        </div>
      </div>
    </PrintLayout>
  )
}

