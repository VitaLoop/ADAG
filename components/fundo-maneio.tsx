"use client"

import { useState } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
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
import { Trash2, Printer, FileDown } from "lucide-react"
import type { Movimento } from "@/types/schema"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

type FundoManeioProps = {
  movimentosIniciais: Movimento[]
  setMovimentos: (movimentos: Movimento[]) => void
  isAdminMode: boolean
}

export function FundoManeio({ movimentosIniciais, setMovimentos, isAdminMode }: FundoManeioProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [movimentoToDelete, setMovimentoToDelete] = useState<string | null>(null)
  const [newMovimento, setNewMovimento] = useState<Partial<Movimento>>({
    tipo: "entrada",
  })

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // Simulação de exportação para PDF
    toast({
      title: "PDF exportado",
      description: "O relatório de fundo de maneio foi exportado em PDF.",
    })
  }

  const handleExportExcel = () => {
    // Simulação de exportação para Excel
    toast({
      title: "Excel exportado",
      description: "O relatório de fundo de maneio foi exportado em Excel.",
    })
  }

  const handleAddMovimento = () => {
    if (newMovimento.data && newMovimento.tipo && newMovimento.valor && newMovimento.descricao) {
      const movimentoToAdd: Movimento = {
        id: Date.now().toString(),
        data: newMovimento.data,
        tipo: newMovimento.tipo,
        valor: newMovimento.valor,
        descricao: newMovimento.descricao,
      }
      setMovimentos([...movimentosIniciais, movimentoToAdd])
      setIsAddDialogOpen(false)
      setNewMovimento({ tipo: "entrada" })
      toast({
        title: "Movimento adicionado",
        description: "O novo movimento foi adicionado com sucesso.",
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
    if (movimentoToDelete) {
      setMovimentos(movimentosIniciais.filter((mov) => mov.id !== movimentoToDelete))
      setIsDeleteDialogOpen(false)
      setMovimentoToDelete(null)
      toast({
        title: "Movimento eliminado",
        description: "O movimento foi removido com sucesso.",
      })
    }
  }

  const calcularSaldo = () => {
    return movimentosIniciais.reduce((acc, mov) => {
      return mov.tipo === "entrada" ? acc + mov.valor : acc - mov.valor
    }, 0)
  }

  return (
    <PrintLayout title="Fundo de Maneio">
      <Card className="border shadow-sm dark:shadow-gray-900/30 overflow-hidden">
        <CardHeader className="bg-muted/50 dark:bg-gray-800/50 pb-2 pt-4 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-sm md:text-base">Fundo de Maneio</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePrint} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportPDF} className="print:hidden">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} className="print:hidden">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4 px-4 bg-white dark:bg-gray-900">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-2xl font-bold">Saldo Atual: {formatCurrency(calcularSaldo())}</div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Adicionar Movimento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Movimento</DialogTitle>
                  <DialogDescription>Preencha os detalhes do novo movimento</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                          {newMovimento.data ? (
                            format(newMovimento.data, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newMovimento.data}
                          onSelect={(date) => setNewMovimento({ ...newMovimento, data: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tipo" className="text-right">
                      Tipo
                    </Label>
                    <Select
                      value={newMovimento.tipo}
                      onValueChange={(value) =>
                        setNewMovimento({ ...newMovimento, tipo: value as "entrada" | "saida" })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="valor" className="text-right">
                      Valor (R$)
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      value={newMovimento.valor || ""}
                      onChange={(e) => setNewMovimento({ ...newMovimento, valor: Number(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao" className="text-right">
                      Descrição
                    </Label>
                    <Input
                      id="descricao"
                      value={newMovimento.descricao || ""}
                      onChange={(e) => setNewMovimento({ ...newMovimento, descricao: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMovimento}>Adicionar Movimento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentosIniciais.length > 0 ? (
                  movimentosIniciais.map((movimento) => (
                    <TableRow
                      key={movimento.id}
                      className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <TableCell>{format(new Date(movimento.data), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            movimento.tipo === "entrada"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                          }
                        >
                          {movimento.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          movimento.tipo === "entrada"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {formatCurrency(movimento.valor)}
                      </TableCell>
                      <TableCell>{movimento.descricao}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setMovimentoToDelete(movimento.id)
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum movimento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este movimento? Esta ação não pode ser desfeita.
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

