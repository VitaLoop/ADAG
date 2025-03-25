"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { PrintLayout } from "@/components/print-layout"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { Pagamento } from "@/types/schema"
import { formatCurrency } from "@/lib/format"

type RelatorioClienteProps = {
  pagamentos: Pagamento[]
}

export function RelatorioCliente({ pagamentos }: RelatorioClienteProps) {
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("")

  const clientes = Array.from(new Set(pagamentos.map((p) => p.fornecedor)))

  const pagamentosCliente = pagamentos.filter((p) => p.fornecedor === clienteSelecionado)

  const totalDivida = pagamentosCliente
    .filter((p) => p.estado === "pendente" || p.estado === "atrasado")
    .reduce((acc, curr) => acc + curr.valor, 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório por Cliente">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Relatório por Cliente</CardTitle>
              <CardDescription>Detalhes dos pagamentos por cliente</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado} className="w-full sm:w-[200px]">
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handlePrint} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clienteSelecionado ? (
            <div className="space-y-4">
              <div className="text-2xl font-bold">Total da Dívida: {formatCurrency(totalDivida)}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Departamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentosCliente.map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell>{pagamento.referencia}</TableCell>
                      <TableCell>{formatCurrency(pagamento.valor)}</TableCell>
                      <TableCell>{format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: pt })}</TableCell>
                      <TableCell>{pagamento.estado}</TableCell>
                      <TableCell>{pagamento.departamento}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">Selecione um cliente para ver o relatório</div>
          )}
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

