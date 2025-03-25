"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
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
import { Trash2, Printer, FileDown, Plus, Search } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { Planilha } from "@/types/schema"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { exportPlanilhasExcel } from "@/lib/excel-export"

type DadosPlanilhaProps = {
  planilhasIniciais: Planilha[]
  setPlanilhas: (planilhas: Planilha[]) => void
  isAdminMode: boolean
}

export function DadosPlanilha({ planilhasIniciais, setPlanilhas, isAdminMode }: DadosPlanilhaProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [anoFiltro, setAnoFiltro] = useState<string>(new Date().getFullYear().toString())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [planilhaToDelete, setPlanilhaToDelete] = useState<string | null>(null)
  const [newPlanilha, setNewPlanilha] = useState<Partial<Planilha>>({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    data: new Date(),
  })

  // Gerar anos para o filtro (últimos 5 anos)
  const anos = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => (anoAtual - i).toString())
  }, [])

  // Filtrar planilhas por ano e termo de busca
  const planilhasFiltradas = useMemo(() => {
    return planilhasIniciais
      .filter((planilha) => {
        const anoMatch = anoFiltro ? planilha.ano.toString() === anoFiltro : true
        const searchMatch = searchTerm ? planilha.historico.toLowerCase().includes(searchTerm.toLowerCase()) : true

        return anoMatch && searchMatch
      })
      .sort((a, b) => {
        // Ordenar por ano e mês
        if (a.ano !== b.ano) return b.ano - a.ano
        return b.mes - a.mes
      })
  }, [planilhasIniciais, anoFiltro, searchTerm])

  // Calcular totais
  const totais = useMemo(() => {
    const totalEntradas = planilhasFiltradas.reduce((sum, p) => sum + p.entradas, 0)
    const totalSaidas = planilhasFiltradas.reduce((sum, p) => sum + p.saidas, 0)

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
    }
  }, [planilhasFiltradas])

  const handleAddPlanilha = () => {
    if (
      newPlanilha.mes &&
      newPlanilha.ano &&
      newPlanilha.historico &&
      newPlanilha.entradas !== undefined &&
      newPlanilha.saidas !== undefined &&
      newPlanilha.data
    ) {
      // Calcular saldo automaticamente
      const saldo = newPlanilha.entradas - newPlanilha.saidas

      const planilhaToAdd: Planilha = {
        id: Date.now().toString(),
        mes: newPlanilha.mes,
        ano: newPlanilha.ano,
        historico: newPlanilha.historico,
        entradas: newPlanilha.entradas,
        saidas: newPlanilha.saidas,
        saldo: saldo,
        data: newPlanilha.data,
      }

      setPlanilhas([...planilhasIniciais, planilhaToAdd])
      setIsAddDialogOpen(false)
      setNewPlanilha({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        data: new Date(),
      })

      toast({
        title: "Planilha adicionada",
        description: "A nova planilha foi adicionada com sucesso.",
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
    if (planilhaToDelete) {
      setPlanilhas(planilhasIniciais.filter((p) => p.id !== planilhaToDelete))
      setIsDeleteDialogOpen(false)
      setPlanilhaToDelete(null)

      toast({
        title: "Planilha eliminada",
        description: "A planilha foi removida com sucesso.",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // Exportar usando a nova função formatada
    const fileName = exportPlanilhasExcel(planilhasFiltradas, {
      ano: anoFiltro !== "todos" ? anoFiltro : undefined,
    })

    toast({
      title: "Excel exportado",
      description: `A planilha foi exportada como ${fileName}.`,
    })
  }

  const handleExportPDF = () => {
    // Criar novo documento PDF
    const doc = new jsPDF()

    // Adicionar título
    doc.setFontSize(18)
    doc.text("Dados Planilha", 14, 22)

    // Adicionar período
    doc.setFontSize(12)
    const periodoTexto = `Ano: ${anoFiltro || "Todos"}`
    doc.text(periodoTexto, 14, 32)

    // Preparar dados para a tabela
    const tableData = planilhasFiltradas.map((p) => [
      getNomeMes(p.mes),
      p.ano.toString(),
      p.historico,
      formatCurrency(p.entradas),
      formatCurrency(p.saidas),
      formatCurrency(p.saldo),
      format(new Date(p.data), "dd/MM/yyyy"),
    ])

    // Adicionar tabela
    doc.autoTable({
      startY: 40,
      head: [["Mês", "Ano", "Histórico", "Entradas", "Saídas", "Saldo", "Data"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [41, 128, 185], textColor: 255 },
      foot: [
        [
          "",
          "",
          "TOTAIS",
          formatCurrency(totais.entradas),
          formatCurrency(totais.saidas),
          formatCurrency(totais.saldo),
          "",
        ],
      ],
    })

    // Salvar o PDF
    doc.save(`Dados_Planilha_${anoFiltro || "Todos"}.pdf`)

    toast({
      title: "PDF exportado",
      description: "A planilha foi exportada em formato PDF.",
    })
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

  // Atualizar automaticamente o saldo quando entradas ou saídas mudam
  const handleValorChange = (campo: "entradas" | "saidas", valor: number) => {
    setNewPlanilha((prev) => {
      const entradas = campo === "entradas" ? valor : prev.entradas || 0
      const saidas = campo === "saidas" ? valor : prev.saidas || 0
      return {
        ...prev,
        [campo]: valor,
        saldo: entradas - saidas,
      }
    })
  }

  return (
    <PrintLayout title="Dados Planilha">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Dados Planilha</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Gerencie os dados financeiros mensais</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrint} className="print:hidden h-9 px-2 md:px-3">
              <Printer className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Imprimir</span>
            </Button>
            <Button onClick={handleExportExcel} className="print:hidden h-9 px-2 md:px-3">
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Excel</span>
            </Button>
            <Button onClick={handleExportPDF} className="print:hidden h-9 px-2 md:px-3">
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">PDF</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar histórico..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={anoFiltro} onValueChange={setAnoFiltro}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {anos.map((ano) => (
                  <SelectItem key={ano} value={ano}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Planilha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Planilha</DialogTitle>
                <DialogDescription>Preencha os detalhes da nova planilha</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mes">Mês</Label>
                    <Select
                      value={newPlanilha.mes?.toString()}
                      onValueChange={(value) => setNewPlanilha({ ...newPlanilha, mes: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                          <SelectItem key={mes} value={mes.toString()}>
                            {getNomeMes(mes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Select
                      value={newPlanilha.ano?.toString()}
                      onValueChange={(value) => setNewPlanilha({ ...newPlanilha, ano: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {anos.map((ano) => (
                          <SelectItem key={ano} value={ano}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="historico">Histórico</Label>
                  <Input
                    id="historico"
                    placeholder="Descrição do histórico"
                    value={newPlanilha.historico || ""}
                    onChange={(e) => setNewPlanilha({ ...newPlanilha, historico: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="entradas">Entradas (R$)</Label>
                    <Input
                      id="entradas"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPlanilha.entradas || ""}
                      onChange={(e) => handleValorChange("entradas", Number(e.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="saidas">Saídas (R$)</Label>
                    <Input
                      id="saidas"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPlanilha.saidas || ""}
                      onChange={(e) => handleValorChange("saidas", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saldo">Saldo (calculado automaticamente)</Label>
                  <Input
                    id="saldo"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={(newPlanilha.entradas || 0) - (newPlanilha.saidas || 0)}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {newPlanilha.data ? (
                          format(newPlanilha.data, "dd/MM/yyyy", { locale: pt })
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newPlanilha.data}
                        onSelect={(date) => setNewPlanilha({ ...newPlanilha, data: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPlanilha}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de planilhas - versão desktop */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div className="rounded-md border overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                  <TableHead className="font-semibold">Mês</TableHead>
                  <TableHead className="font-semibold">Ano</TableHead>
                  <TableHead className="font-semibold">Histórico</TableHead>
                  <TableHead className="text-right font-semibold">Entradas</TableHead>
                  <TableHead className="text-right font-semibold">Saídas</TableHead>
                  <TableHead className="text-right font-semibold">Saldo</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planilhasFiltradas.length > 0 ? (
                  planilhasFiltradas.map((planilha) => (
                    <TableRow
                      key={planilha.id}
                      className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <TableCell>{getNomeMes(planilha.mes)}</TableCell>
                      <TableCell>{planilha.ano}</TableCell>
                      <TableCell>{planilha.historico}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(planilha.entradas)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {formatCurrency(planilha.saidas)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(planilha.saldo)}</TableCell>
                      <TableCell>{format(new Date(planilha.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setPlanilhaToDelete(planilha.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Nenhuma planilha encontrada para o período selecionado.
                    </TableCell>
                  </TableRow>
                )}
                {planilhasFiltradas.length > 0 && (
                  <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70 font-bold">
                    <TableCell colSpan={3}>TOTAIS</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatCurrency(totais.entradas)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">
                      {formatCurrency(totais.saidas)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totais.saldo)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Lista de planilhas - versão mobile */}
        <div className="md:hidden space-y-3 mt-4">
          {planilhasFiltradas.length > 0 ? (
            planilhasFiltradas.map((planilha) => (
              <Card key={planilha.id} className="shadow-sm border border-border/60 dark:border-gray-700/60">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">
                        {getNomeMes(planilha.mes)} {planilha.ano}
                      </div>
                      <div className="text-sm text-muted-foreground">{planilha.historico}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold">{formatCurrency(planilha.saldo)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(planilha.data), "dd/MM/yyyy", { locale: pt })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col">
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Entradas: {formatCurrency(planilha.entradas)}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Saídas: {formatCurrency(planilha.saidas)}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPlanilhaToDelete(planilha.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma planilha encontrada para o período selecionado.
            </div>
          )}

          {planilhasFiltradas.length > 0 && (
            <Card className="shadow-sm bg-muted/30 dark:bg-gray-800/30 border border-border/60 dark:border-gray-700/60">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold">TOTAIS</div>
                  <div className="font-bold">{formatCurrency(totais.saldo)}</div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Entradas: {formatCurrency(totais.entradas)}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Saídas: {formatCurrency(totais.saidas)}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Diálogo de confirmação para exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta planilha? Esta ação não pode ser desfeita.
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
      </div>
    </PrintLayout>
  )
}

