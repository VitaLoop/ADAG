"use client"

import { useState } from "react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
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
import { toast } from "@/components/ui/use-toast"
import { PrintLayout } from "@/components/print-layout"
import { Trash2, Printer, FileDown } from "lucide-react"
import type { Cheque } from "@/types/schema"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

type ControloChequeProps = {
  chequesIniciais: Cheque[]
  setCheques: (cheques: Cheque[]) => void
  isAdminMode: boolean
}

export function ControloCheques({ chequesIniciais, setCheques, isAdminMode }: ControloChequeProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [chequeToDelete, setChequeToDelete] = useState<string | null>(null)
  const [newCheque, setNewCheque] = useState<Partial<Cheque>>({
    estado: "pendente",
  })

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // Simulação de exportação para PDF
    toast({
      title: "PDF exportado",
      description: "O relatório de cheques foi exportado em PDF.",
    })
  }

  const handleExportExcel = () => {
    // Simulação de exportação para Excel
    toast({
      title: "Excel exportado",
      description: "O relatório de cheques foi exportado em Excel.",
    })
  }

  const handleAddCheque = () => {
    if (newCheque.numero && newCheque.valor && newCheque.beneficiario && newCheque.dataEmissao) {
      const chequeToAdd: Cheque = {
        id: Date.now().toString(),
        numero: newCheque.numero,
        valor: newCheque.valor,
        beneficiario: newCheque.beneficiario,
        dataEmissao: newCheque.dataEmissao,
        dataCompensacao: null,
        estado: "pendente",
      }
      setCheques([...chequesIniciais, chequeToAdd])
      setIsAddDialogOpen(false)
      setNewCheque({ estado: "pendente" })
      toast({
        title: "Cheque adicionado",
        description: "O novo cheque foi adicionado com sucesso.",
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
    if (chequeToDelete) {
      setCheques(chequesIniciais.filter((cheque) => cheque.id !== chequeToDelete))
      setIsDeleteDialogOpen(false)
      setChequeToDelete(null)
      toast({
        title: "Cheque eliminado",
        description: "O cheque foi removido permanentemente.",
      })
    }
  }

  const handleCompensarCheque = (id: string) => {
    setCheques(
      chequesIniciais.map((cheque) =>
        cheque.id === id ? { ...cheque, estado: "compensado", dataCompensacao: new Date() } : cheque,
      ),
    )
    toast({
      title: "Cheque compensado",
      description: "O cheque foi marcado como compensado.",
    })
  }

  return (
    <PrintLayout title="Controlo de Cheques">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Controlo de Cheques</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Gerencie os cheques emitidos e pendentes</p>
          </div>
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

        <div className="mb-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Adicionar Novo Cheque</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cheque</DialogTitle>
                <DialogDescription>Preencha os detalhes do novo cheque</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="numero" className="text-right">
                    Número
                  </Label>
                  <Input
                    id="numero"
                    value={newCheque.numero || ""}
                    onChange={(e) => setNewCheque({ ...newCheque, numero: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    value={newCheque.valor || ""}
                    onChange={(e) => setNewCheque({ ...newCheque, valor: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="beneficiario" className="text-right">
                    Beneficiário
                  </Label>
                  <Input
                    id="beneficiario"
                    value={newCheque.beneficiario || ""}
                    onChange={(e) => setNewCheque({ ...newCheque, beneficiario: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataEmissao" className="text-right">
                    Data de Emissão
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                        {newCheque.dataEmissao ? (
                          format(newCheque.dataEmissao, "dd/MM/yyyy", { locale: pt })
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCheque.dataEmissao}
                        onSelect={(date) => setNewCheque({ ...newCheque, dataEmissao: date })}
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
                <Button onClick={handleAddCheque}>Adicionar Cheque</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/70 dark:hover:bg-gray-800/70">
                <TableHead className="font-semibold">Número</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Beneficiário</TableHead>
                <TableHead className="font-semibold">Data de Emissão</TableHead>
                <TableHead className="font-semibold">Data de Compensação</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chequesIniciais.length > 0 ? (
                chequesIniciais.map((cheque) => (
                  <TableRow
                    key={cheque.id}
                    className="border-b border-border/50 dark:border-gray-700/50 hover:bg-muted/30 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <TableCell>{cheque.numero}</TableCell>
                    <TableCell>{formatCurrency(cheque.valor)}</TableCell>
                    <TableCell>{cheque.beneficiario}</TableCell>
                    <TableCell>{format(new Date(cheque.dataEmissao), "dd/MM/yyyy", { locale: pt })}</TableCell>
                    <TableCell>
                      {cheque.dataCompensacao
                        ? format(new Date(cheque.dataCompensacao), "dd/MM/yyyy", { locale: pt })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cheque.estado === "pendente"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                        }
                      >
                        {cheque.estado === "pendente" ? "Pendente" : "Compensado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {cheque.estado === "pendente" && (
                          <Button size="sm" onClick={() => handleCompensarCheque(cheque.id)}>
                            Compensar
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setChequeToDelete(cheque.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum cheque encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Diálogo de confirmação para exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este cheque? Esta ação não pode ser desfeita.
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

