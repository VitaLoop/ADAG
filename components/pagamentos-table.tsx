"use client"

import { useState } from "react"
import { Check, Download, FileText, MoreHorizontal, Plus, Search, Trash, Printer } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PrintLayout } from "@/components/print-layout"
import type { Pagamento } from "@/types/schema"
import { formatCurrency } from "@/lib/format"

type PagamentosTableProps = {
  pagamentosIniciais: Pagamento[]
  setPagamentos: (pagamentos: Pagamento[]) => void
  isAdminMode: boolean
}

export function PagamentosTable({ pagamentosIniciais, setPagamentos, isAdminMode }: PagamentosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPagamento, setNewPagamento] = useState<Partial<Pagamento>>({
    estado: "pendente",
    metodo: "transferência",
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState<string | null>(null)

  const filteredPagamentos = pagamentosIniciais.filter(
    (pagamento) =>
      pagamento.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddPagamento = () => {
    if (
      newPagamento.referencia &&
      newPagamento.fornecedor &&
      newPagamento.valor &&
      newPagamento.dataVencimento &&
      newPagamento.estado &&
      newPagamento.metodo &&
      newPagamento.departamento
    ) {
      const novoPagamento: Pagamento = {
        id: Date.now().toString(),
        referencia: newPagamento.referencia,
        fornecedor: newPagamento.fornecedor,
        valor: newPagamento.valor,
        dataVencimento: newPagamento.dataVencimento,
        dataPagamento: newPagamento.dataPagamento || null,
        estado: newPagamento.estado as "pendente" | "pago" | "atrasado" | "cancelado",
        metodo: newPagamento.metodo as "transferência" | "cheque" | "débito direto" | "outro",
        departamento: newPagamento.departamento,
        observacoes: newPagamento.observacoes || "",
      }

      setPagamentos([...pagamentosIniciais, novoPagamento])
      setNewPagamento({
        estado: "pendente",
        metodo: "transferência",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Pagamento adicionado",
        description: "O novo pagamento foi adicionado com sucesso.",
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
    if (pagamentoToDelete) {
      setPagamentos(pagamentosIniciais.filter((pagamento) => pagamento.id !== pagamentoToDelete))
      setIsDeleteDialogOpen(false)
      setPagamentoToDelete(null)

      toast({
        title: "Pagamento eliminado",
        description: "O pagamento foi removido permanentemente.",
      })
    }
  }

  const handleMarkAsPaid = (id: string) => {
    setPagamentos(
      pagamentosIniciais.map((pagamento) =>
        pagamento.id === id ? { ...pagamento, estado: "pago", dataPagamento: new Date() } : pagamento,
      ),
    )
    toast({
      title: "Pagamento atualizado",
      description: "O pagamento foi marcado como pago.",
    })
  }

  const handleExportPDF = (pagamento: Pagamento) => {
    // Simulação de exportação para PDF
    console.log("Exportando para PDF:", pagamento)
    toast({
      title: "PDF exportado",
      description: `O PDF do pagamento ${pagamento.referencia} foi gerado.`,
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
          >
            Pendente
          </Badge>
        )
      case "pago":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
          >
            Pago
          </Badge>
        )
      case "atrasado":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
          >
            Atrasado
          </Badge>
        )
      case "cancelado":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
          >
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório de Pagamentos">
      <div className="space-y-4">
        {isAdminMode && (
          <Alert>
            <AlertTitle>Modo Administrador Ativo</AlertTitle>
            <AlertDescription>
              Você está operando com privilégios de administrador. Todas as ações serão registradas.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar pagamentos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Pagamento</DialogTitle>
                  <DialogDescription>Preencha os detalhes do pagamento a ser adicionado ao sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="referencia">Referência</Label>
                      <Input
                        id="referencia"
                        placeholder="FAT-2023-XXX"
                        value={newPagamento.referencia || ""}
                        onChange={(e) => setNewPagamento({ ...newPagamento, referencia: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <Input
                        id="fornecedor"
                        placeholder="Nome do fornecedor"
                        value={newPagamento.fornecedor || ""}
                        onChange={(e) => setNewPagamento({ ...newPagamento, fornecedor: e.target.value })}
                      />
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
                        value={newPagamento.valor || ""}
                        onChange={(e) => setNewPagamento({ ...newPagamento, valor: Number.parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {newPagamento.dataVencimento ? (
                              format(newPagamento.dataVencimento, "dd/MM/yyyy", { locale: pt })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newPagamento.dataVencimento}
                            onSelect={(date) => setNewPagamento({ ...newPagamento, dataVencimento: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={newPagamento.estado}
                        onValueChange={(value) => setNewPagamento({ ...newPagamento, estado: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="metodo">Método de Pagamento</Label>
                      <Select
                        value={newPagamento.metodo}
                        onValueChange={(value) => setNewPagamento({ ...newPagamento, metodo: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferência">Transferência</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="débito direto">Débito Direto</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        placeholder="Nome do departamento"
                        value={newPagamento.departamento || ""}
                        onChange={(e) => setNewPagamento({ ...newPagamento, departamento: e.target.value })}
                      />
                    </div>
                    {newPagamento.estado === "pago" && (
                      <div className="grid gap-2">
                        <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              {newPagamento.dataPagamento ? (
                                format(newPagamento.dataPagamento, "dd/MM/yyyy", { locale: pt })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newPagamento.dataPagamento}
                              onSelect={(date) => setNewPagamento({ ...newPagamento, dataPagamento: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      placeholder="Observações adicionais"
                      value={newPagamento.observacoes || ""}
                      onChange={(e) => setNewPagamento({ ...newPagamento, observacoes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddPagamento}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                <TableHead className="w-[100px] font-semibold">Referência</TableHead>
                <TableHead className="font-semibold">Fornecedor</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Vencimento</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Departamento</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPagamentos.length > 0 ? (
                filteredPagamentos.map((pagamento) => (
                  <TableRow
                    key={pagamento.id}
                    className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <TableCell className="font-medium">{pagamento.referencia}</TableCell>
                    <TableCell>{pagamento.fornecedor}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pagamento.valor)}</TableCell>
                    <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                    <TableCell>{getEstadoBadge(pagamento.estado)}</TableCell>
                    <TableCell>{pagamento.departamento}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
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
                                // Visualizar detalhes
                                toast({
                                  title: "Detalhes do pagamento",
                                  description: `Visualizando detalhes de ${pagamento.referencia}`,
                                })
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Visualizar detalhes
                            </DropdownMenuItem>
                            {pagamento.estado !== "pago" && pagamento.estado !== "cancelado" && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(pagamento.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Marcar como pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleExportPDF(pagamento)}>
                              <Download className="mr-2 h-4 w-4" />
                              Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                setPagamentoToDelete(pagamento.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum pagamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
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

