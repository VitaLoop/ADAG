"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrintLayout } from "@/components/print-layout"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Pagamento } from "@/types/schema"
import { formatCurrency } from "@/lib/format"

type RelatorioDividaProps = {
  pagamentos: Pagamento[]
}

export function RelatorioDivida({ pagamentos }: RelatorioDividaProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  const calcularTotalPorDepartamento = () => {
    const totais: { [key: string]: { pendente: number; atrasado: number } } = {}

    pagamentos.forEach((pagamento) => {
      if (filtroEstado === "todos" || pagamento.estado === filtroEstado) {
        if (!totais[pagamento.departamento]) {
          totais[pagamento.departamento] = { pendente: 0, atrasado: 0 }
        }
        if (pagamento.estado === "pendente" || pagamento.estado === "atrasado") {
          totais[pagamento.departamento][pagamento.estado] += pagamento.valor
        }
      }
    })

    return Object.entries(totais).map(([departamento, valores]) => ({
      departamento,
      pendente: valores.pendente,
      atrasado: valores.atrasado,
    }))
  }

  const dadosGrafico = calcularTotalPorDepartamento()

  const totalDivida = dadosGrafico.reduce((acc, curr) => acc + curr.pendente + curr.atrasado, 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <PrintLayout title="Relatório de Dívida">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Relatório de Dívida</CardTitle>
              <CardDescription>Visão geral das dívidas por departamento</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={filtroEstado} onValueChange={setFiltroEstado} className="w-full sm:w-[180px]">
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
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
          <div className="space-y-4">
            <div className="text-2xl font-bold">Total da Dívida: {formatCurrency(totalDivida)}</div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departamento" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), ""]}
                    labelFormatter={(label) => `Departamento: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="pendente" name="Pendente" fill="#facc15" />
                  <Bar dataKey="atrasado" name="Atrasado" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </PrintLayout>
  )
}

