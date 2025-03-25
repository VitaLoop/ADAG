import * as XLSX from "xlsx"
import type { Transacao, Planilha } from "@/types/schema"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

// Função para formatar valor monetário
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Função para exportar transações para Excel com formato de livro caixa
export const exportTransacoesExcel = (transacoes: Transacao[], filtros: { mes?: string; ano?: string }) => {
  // Agrupar transações por mês
  const transacoesPorMes: { [key: string]: Transacao[] } = {}

  transacoes.forEach((transacao) => {
    const data = new Date(transacao.data)
    const mesAno = `${data.getMonth() + 1}-${data.getFullYear()}`

    if (!transacoesPorMes[mesAno]) {
      transacoesPorMes[mesAno] = []
    }

    transacoesPorMes[mesAno].push(transacao)
  })

  // Criar workbook
  const wb = XLSX.utils.book_new()

  // Para cada mês, criar uma planilha
  Object.entries(transacoesPorMes).forEach(([mesAno, transacoesMes]) => {
    const [mes, ano] = mesAno.split("-")
    const nomeMes = format(new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1), "MMMM", { locale: pt })
    const nomePlanilha = `${nomeMes}-${ano}`

    // Ordenar transações por data
    transacoesMes.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    // Criar cabeçalho do livro caixa
    const cabecalho = [
      ["LIVRO CAIXA"],
      ["MÊS E ANO:", "", `${nomeMes}-${ano}`, "", "Folha nº", "1"],
      ["", "HISTÓRICO", "ENTRADAS", "SAÍDAS", "SALDO"],
      ["Saldo anterior", "", "", "", "0.00"],
    ]

    // Calcular saldo inicial
    let saldoAtual = 0

    // Criar linhas de dados
    const linhas = transacoesMes.map((transacao) => {
      const valor = transacao.valor
      const entrada = transacao.tipo === "entrada" ? valor : 0
      const saida = transacao.tipo === "saida" ? valor : 0

      saldoAtual += entrada - saida

      return [
        format(new Date(transacao.data), "dd/MM/yy"),
        transacao.descricao,
        entrada ? entrada.toFixed(2) : "",
        saida ? saida.toFixed(2) : "",
        saldoAtual.toFixed(2),
      ]
    })

    // Adicionar totais
    const totalEntradas = transacoesMes.filter((t) => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0)
    const totalSaidas = transacoesMes.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)

    const rodape = [
      ["TOTAIS DESTA FOLHA", "", totalEntradas.toFixed(2), totalSaidas.toFixed(2), ""],
      ["SALDO ATUAL", "", "", "", saldoAtual.toFixed(2)],
      [""],
      ["Responsável: ____________________________"],
      ["Tesouraria: ____________________________"],
    ]

    // Juntar tudo
    const dados = [...cabecalho, ...linhas, ...rodape]

    // Criar planilha
    const ws = XLSX.utils.aoa_to_sheet(dados)

    // Definir largura das colunas
    const wscols = [
      { wch: 10 }, // Data
      { wch: 40 }, // Histórico
      { wch: 15 }, // Entradas
      { wch: 15 }, // Saídas
      { wch: 15 }, // Saldo
    ]

    ws["!cols"] = wscols

    // Adicionar estilos (cores)
    // Nota: XLSX não suporta estilos completos, mas podemos definir alguns básicos

    // Mesclar células para o título
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Mês e Ano
    ]

    // Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(wb, ws, nomePlanilha)
  })

  // Criar planilha de resumo
  const resumoData = [
    ["RESUMO FINANCEIRO"],
    [""],
    ["Período:", filtros.mes ? `Mês ${filtros.mes}` : "Todos os meses", filtros.ano || new Date().getFullYear()],
    [""],
    ["Mês", "Entradas", "Saídas", "Saldo"],
  ]

  // Adicionar resumo por mês
  let totalGeralEntradas = 0
  let totalGeralSaidas = 0

  Object.entries(transacoesPorMes).forEach(([mesAno, transacoesMes]) => {
    const [mes, ano] = mesAno.split("-")
    const nomeMes = format(new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1), "MMMM", { locale: pt })

    const entradasMes = transacoesMes.filter((t) => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0)
    const saidasMes = transacoesMes.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)
    const saldoMes = entradasMes - saidasMes

    totalGeralEntradas += entradasMes
    totalGeralSaidas += saidasMes

    resumoData.push([`${nomeMes}-${ano}`, entradasMes.toFixed(2), saidasMes.toFixed(2), saldoMes.toFixed(2)])
  })

  // Adicionar totais gerais
  resumoData.push([""])
  resumoData.push([
    "TOTAL GERAL",
    totalGeralEntradas.toFixed(2),
    totalGeralSaidas.toFixed(2),
    (totalGeralEntradas - totalGeralSaidas).toFixed(2),
  ])

  // Criar planilha de resumo
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)

  // Definir largura das colunas
  const wscolsResumo = [
    { wch: 20 }, // Mês
    { wch: 15 }, // Entradas
    { wch: 15 }, // Saídas
    { wch: 15 }, // Saldo
  ]

  wsResumo["!cols"] = wscolsResumo

  // Mesclar células para o título
  wsResumo["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título
  ]

  // Adicionar a planilha de resumo ao workbook
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo")

  // Exportar arquivo
  const fileName = `Transacoes_${filtros.mes || "Todos"}_${filtros.ano || new Date().getFullYear()}.xlsx`
  XLSX.writeFile(wb, fileName)

  return fileName
}

// Função para exportar planilhas para Excel
export const exportPlanilhasExcel = (planilhas: Planilha[], filtros: { ano?: string }) => {
  // Criar workbook
  const wb = XLSX.utils.book_new()

  // Criar dados para a planilha
  const dados = [
    ["RELATÓRIO DE PLANILHAS FINANCEIRAS"],
    [""],
    ["Ano:", filtros.ano || "Todos"],
    [""],
    ["Mês", "Ano", "Histórico", "Entradas", "Saídas", "Saldo", "Data de Registro"],
  ]

  // Ordenar planilhas por ano e mês
  planilhas.sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano
    return a.mes - b.mes
  })

  // Adicionar dados das planilhas
  planilhas.forEach((planilha) => {
    const nomeMes = format(new Date(planilha.ano, planilha.mes - 1, 1), "MMMM", { locale: pt })

    dados.push([
      nomeMes,
      planilha.ano.toString(),
      planilha.historico,
      planilha.entradas.toFixed(2),
      planilha.saidas.toFixed(2),
      planilha.saldo.toFixed(2),
      format(new Date(planilha.data), "dd/MM/yyyy"),
    ])
  })

  // Adicionar totais
  const totalEntradas = planilhas.reduce((sum, p) => sum + p.entradas, 0)
  const totalSaidas = planilhas.reduce((sum, p) => sum + p.saidas, 0)
  const totalSaldo = planilhas.reduce((sum, p) => sum + p.saldo, 0)

  dados.push([""])
  dados.push(["TOTAIS", "", "", totalEntradas.toFixed(2), totalSaidas.toFixed(2), totalSaldo.toFixed(2), ""])

  // Criar planilha
  const ws = XLSX.utils.aoa_to_sheet(dados)

  // Definir largura das colunas
  const wscols = [
    { wch: 15 }, // Mês
    { wch: 10 }, // Ano
    { wch: 40 }, // Histórico
    { wch: 15 }, // Entradas
    { wch: 15 }, // Saídas
    { wch: 15 }, // Saldo
    { wch: 20 }, // Data
  ]

  ws["!cols"] = wscols

  // Mesclar células para o título
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título
  ]

  // Adicionar a planilha ao workbook
  XLSX.utils.book_append_sheet(wb, ws, "Planilhas")

  // Exportar arquivo
  const fileName = `Planilhas_${filtros.ano || "Todos"}.xlsx`
  XLSX.writeFile(wb, fileName)

  return fileName
}

