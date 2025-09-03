"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react"
import * as XLSX from "xlsx"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExcelRoute {
  motorista: string
  origem: string
  destino1: string
  destino2?: string
  destino3?: string
  quantidadePacotes: number
  valorPorPacote: number
  outrosCustos: number
}

interface ProcessedRoute {
  driver: string
  origin: string
  destinations: Array<{
    id: string
    city: string
    packages: number
    valuePerPackage: number
  }>
  routeCost: number
}

interface ExcelImportProps {
  onRoutesImported: (routes: ProcessedRoute[]) => void
}

export default function ExcelImport({ onRoutesImported }: ExcelImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: ProcessedRoute[]
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  // Função para gerar e baixar o modelo Excel com multiplicador
  const downloadTemplate = () => {
    const templateData = [
      {
        motorista: "João Silva",
        origem: "São Paulo, SP",
        destino1: "Rio de Janeiro, RJ",
        destino2: "Belo Horizonte, MG",
        destino3: "",
        quantidadePacotes: 50,
        valorPorPacote: 25.5,
        outrosCustos: 400,
      },
      {
        motorista: "Maria Santos",
        origem: "Curitiba, PR",
        destino1: "Florianópolis, SC",
        destino2: "Porto Alegre, RS",
        destino3: "Caxias do Sul, RS",
        quantidadePacotes: 75,
        valorPorPacote: 30.0,
        outrosCustos: 600,
      },
      {
        motorista: "Pedro Costa",
        origem: "Salvador, BA",
        destino1: "Recife, PE",
        destino2: "",
        destino3: "",
        quantidadePacotes: 30,
        valorPorPacote: 40.0,
        outrosCustos: 350,
      },
    ]

    // Cria workbook/worksheet
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()

    // Definir larguras das colunas (apenas campos de entrada)
    ws["!cols"] = [
      { wch: 15 }, // motorista
      { wch: 20 }, // origem
      { wch: 20 }, // destino1
      { wch: 20 }, // destino2
      { wch: 20 }, // destino3
      { wch: 12 }, // quantidadePacotes
      { wch: 12 }, // valorPorPacote
      { wch: 12 }, // outrosCustos
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Rotas")

    // Aba de instruções detalhadas
    const instructionsData = [
      {
        Campo: "motorista",
        Descrição: "Nome completo do motorista",
        Exemplo: "João Silva",
        Obrigatório: "SIM",
        Tipo: "Texto",
      },
      {
        Campo: "origem",
        Descrição: "Cidade de coleta (inclua estado)",
        Exemplo: "São Paulo, SP",
        Obrigatório: "SIM",
        Tipo: "Texto",
      },
      {
        Campo: "destino1",
        Descrição: "Primeira cidade de destino",
        Exemplo: "Rio de Janeiro, RJ",
        Obrigatório: "SIM",
        Tipo: "Texto",
      },
      {
        Campo: "destino2",
        Descrição: "Segunda cidade de destino (opcional)",
        Exemplo: "Belo Horizonte, MG",
        Obrigatório: "NÃO",
        Tipo: "Texto",
      },
      {
        Campo: "destino3",
        Descrição: "Terceira cidade de destino (opcional)",
        Exemplo: "Santos, SP",
        Obrigatório: "NÃO",
        Tipo: "Texto",
      },
      {
        Campo: "quantidadePacotes",
        Descrição: "Quantidade total de pacotes",
        Exemplo: "50",
        Obrigatório: "SIM",
        Tipo: "Número",
      },
      {
        Campo: "valorPorPacote",
        Descrição: "Valor unitário por pacote (multiplicador)",
        Exemplo: "25.50",
        Obrigatório: "SIM",
        Tipo: "Número",
      },
      {
        Campo: "outrosCustos",
        Descrição: "Custos extras (pedágios, combustível, etc.)",
        Exemplo: "400.00",
        Obrigatório: "SIM",
        Tipo: "Número",
      },
    ]

    const instr = XLSX.utils.json_to_sheet(instructionsData)
    instr["!cols"] = [{ wch: 18 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, instr, "Instruções")

    // Aba com exemplos de cálculo
    const calculosData = [
      {
        Exemplo: "Rota Simples",
        Pacotes: 50,
        "Valor/Pacote": 25.5,
        "Receita Total": "50 × 25.50 = R$ 1.275,00",
        "Outros Custos": 400,
        "Lucro Bruto": "1.275 - 400 = R$ 875,00",
        "Margem %": "875 ÷ 1.275 × 100 = 68.6%",
      },
      {
        Exemplo: "Rota Múltipla",
        Pacotes: 75,
        "Valor/Pacote": 30.0,
        "Receita Total": "75 × 30.00 = R$ 2.250,00",
        "Outros Custos": 600,
        "Lucro Bruto": "2.250 - 600 = R$ 1.650,00",
        "Margem %": "1.650 ÷ 2.250 × 100 = 73.3%",
      },
      {
        Exemplo: "Rota Econômica",
        Pacotes: 30,
        "Valor/Pacote": 40.0,
        "Receita Total": "30 × 40.00 = R$ 1.200,00",
        "Outros Custos": 350,
        "Lucro Bruto": "1.200 - 350 = R$ 850,00",
        "Margem %": "850 ÷ 1.200 × 100 = 70.8%",
      },
    ]

    const calculos = XLSX.utils.json_to_sheet(calculosData)
    calculos["!cols"] = [{ wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, calculos, "Exemplos de Cálculo")

    // Aba com regras importantes
    const rulesData = [
      {
        Regra: "Fórmula Principal",
        Detalhes: "Receita Total = Quantidade de Pacotes × Valor por Pacote",
      },
      {
        Regra: "Lucro Bruto",
        Detalhes: "Lucro = Receita Total - Outros Custos (sem combustível)",
      },
      {
        Regra: "Combustível",
        Detalhes: "Calculado automaticamente baseado na origem da rota",
      },
      {
        Regra: "Distribuição",
        Detalhes: "Pacotes distribuídos igualmente entre os destinos",
      },
      {
        Regra: "Destinos",
        Detalhes: "Mínimo 1 destino (destino1), máximo 3 destinos",
      },
      {
        Regra: "Valores",
        Detalhes: "Todos os valores devem ser números positivos",
      },
      {
        Regra: "Cidades",
        Detalhes: "Sempre incluir estado: 'São Paulo, SP'",
      },
    ]

    const rules = XLSX.utils.json_to_sheet(rulesData)
    rules["!cols"] = [{ wch: 20 }, { wch: 60 }]
    XLSX.utils.book_append_sheet(wb, rules, "Regras")

    /* Gera ArrayBuffer (type: 'array') */
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

    /* Cria blob e força download */
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `modelo-rotas-multiplicador-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Função para processar o arquivo Excel com multiplicador
  const processExcelFile = async (file: File) => {
    setIsProcessing(true)
    const results: { success: ProcessedRoute[]; errors: string[] } = {
      success: [],
      errors: [],
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: ExcelRoute[] = XLSX.utils.sheet_to_json(worksheet)

      if (!data || data.length === 0) {
        results.errors.push("Arquivo Excel está vazio ou não contém dados válidos")
        setImportResults(results)
        setIsProcessing(false)
        return
      }

      // Processar cada linha
      data.forEach((row, index) => {
        const lineNumber = index + 2 // +2 porque Excel começa em 1 e tem cabeçalho

        try {
          // Validar campos obrigatórios básicos
          if (!row.motorista || typeof row.motorista !== "string") {
            results.errors.push(`Linha ${lineNumber}: Nome do motorista é obrigatório`)
            return
          }

          if (!row.origem || typeof row.origem !== "string") {
            results.errors.push(`Linha ${lineNumber}: Cidade de origem é obrigatória`)
            return
          }

          if (!row.destino1 || typeof row.destino1 !== "string") {
            results.errors.push(`Linha ${lineNumber}: Pelo menos o destino1 é obrigatório`)
            return
          }

          if (!row.quantidadePacotes || typeof row.quantidadePacotes !== "number" || row.quantidadePacotes <= 0) {
            results.errors.push(`Linha ${lineNumber}: Quantidade de pacotes deve ser um número maior que zero`)
            return
          }

          if (!row.valorPorPacote || typeof row.valorPorPacote !== "number" || row.valorPorPacote <= 0) {
            results.errors.push(`Linha ${lineNumber}: Valor por pacote deve ser um número maior que zero`)
            return
          }

          if (typeof row.outrosCustos !== "number" || row.outrosCustos < 0) {
            results.errors.push(`Linha ${lineNumber}: Outros custos deve ser um número maior ou igual a zero`)
            return
          }

          // Coletar destinos válidos
          const destinationCities: string[] = []

          // Destino 1 (obrigatório)
          destinationCities.push(row.destino1.trim())

          // Destino 2 (opcional)
          if (row.destino2 && typeof row.destino2 === "string" && row.destino2.trim()) {
            destinationCities.push(row.destino2.trim())
          }

          // Destino 3 (opcional)
          if (row.destino3 && typeof row.destino3 === "string" && row.destino3.trim()) {
            destinationCities.push(row.destino3.trim())
          }

          // Calcular distribuição automática
          const totalDestinations = destinationCities.length
          const packagesPerDestination = Math.floor(row.quantidadePacotes / totalDestinations)
          const remainingPackages = row.quantidadePacotes % totalDestinations

          // Criar array de destinos com distribuição automática
          const destinations: Array<{
            id: string
            city: string
            packages: number
            valuePerPackage: number
          }> = []

          destinationCities.forEach((city, destIndex) => {
            // Distribuir pacotes restantes nos primeiros destinos
            const packagesForThisDestination = packagesPerDestination + (destIndex < remainingPackages ? 1 : 0)

            destinations.push({
              id: `${Date.now()}-${index}-${destIndex}`,
              city: city,
              packages: packagesForThisDestination,
              valuePerPackage: Number(row.valorPorPacote.toFixed(2)),
            })
          })

          // Criar rota processada
          const processedRoute: ProcessedRoute = {
            driver: row.motorista.trim(),
            origin: row.origem.trim(),
            destinations: destinations,
            routeCost: Number(row.outrosCustos.toFixed(2)),
          }

          results.success.push(processedRoute)
        } catch (error) {
          results.errors.push(`Linha ${lineNumber}: Erro ao processar dados - ${error}`)
        }
      })

      setImportResults(results)

      // Se há rotas válidas, importar automaticamente e mostrar o diálogo de sucesso
      if (results.success.length > 0) {
        onRoutesImported(results.success)
        setImportedCount(results.success.length) // Define a contagem para o diálogo
        setShowSuccessDialog(true) // Mostra o diálogo de sucesso
      }
    } catch (error) {
      results.errors.push(`Erro ao ler arquivo Excel: ${error}`)
      setImportResults(results)
    }

    setIsProcessing(false)
  }

  // Função para lidar com seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        alert("Por favor, selecione um arquivo Excel (.xlsx ou .xls)")
        return
      }
      processExcelFile(file)
    }
  }

  // Função para limpar resultados
  const clearResults = () => {
    setImportResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#fa3a2f]" />
          Importar Rotas do Excel (Multiplicador)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Baixar Modelo Excel
          </Button>

          <div className="flex items-center gap-2">
            <Label htmlFor="excel-file" className="sr-only">
              Selecionar arquivo Excel
            </Label>
            <Input
              id="excel-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-[#fa3a2f] hover:bg-[#e8342a] flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? "Processando..." : "Selecionar Arquivo"}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📋 Como usar (Sistema de Multiplicador):</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Baixe o modelo Excel com sistema de multiplicador</li>
            <li>
              2. Preencha <strong>quantidade de pacotes</strong> e <strong>valor por pacote</strong>
            </li>
            <li>3. O sistema calcula automaticamente: Receita = Pacotes × Valor/Pacote</li>
            <li>4. Adicione os custos extras (pedágios, alimentação, etc.)</li>
            <li>5. A aplicação fará todas as análises de lucro automaticamente</li>
          </ol>
        </div>

        {/* Resultados da importação */}
        {importResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Resultados da Importação</h4>
              <Button onClick={clearResults} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Sucessos */}
            {importResults.success.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    {importResults.success.length} rotas importadas com sucesso
                  </span>
                </div>
                <div className="space-y-2">
                  {importResults.success.map((route, index) => (
                    <div key={index} className="text-sm text-green-700">
                      <Badge variant="outline" className="mr-2">
                        {route.driver}
                      </Badge>
                      <span className="font-medium">{route.origin} →</span>
                      {route.destinations.map((dest, destIndex) => (
                        <span key={dest.id} className="ml-1">
                          {destIndex > 0 && " →"} {dest.city} ({dest.packages}x)
                        </span>
                      ))}
                      <Badge variant="secondary" className="ml-2">
                        {route.destinations.reduce((sum, dest) => sum + dest.packages, 0)} pacotes
                      </Badge>
                      <Badge variant="secondary" className="ml-1">
                        R$ {route.destinations[0].valuePerPackage.toFixed(2)}/pacote
                      </Badge>
                      <Badge variant="default" className="ml-1 bg-green-600">
                        Receita: R${" "}
                        {route.destinations
                          .reduce((sum, dest) => sum + dest.packages * dest.valuePerPackage, 0)
                          .toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erros */}
            {importResults.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">{importResults.errors.length} erros encontrados</span>
                </div>
                <div className="space-y-1">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formato esperado */}
        <div className="p-4 bg-gray-50 border rounded-lg">
          <h4 className="font-medium mb-2">📊 Formato do Excel (Sistema Multiplicador):</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#fa3a2f] text-white">
                  <th className="border p-2 text-left">motorista</th>
                  <th className="border p-2 text-left">origem</th>
                  <th className="border p-2 text-left bg-green-600">destino1*</th>
                  <th className="border p-2 text-left bg-blue-600">destino2</th>
                  <th className="border p-2 text-left bg-purple-600">destino3</th>
                  <th className="border p-2 text-left bg-orange-600">qtdPacotes*</th>
                  <th className="border p-2 text-left bg-orange-600">valor/Pacote*</th>
                  <th className="border p-2 text-left">outrosCustos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">João Silva</td>
                  <td className="border p-2">São Paulo, SP</td>
                  <td className="border p-2 bg-green-50">Rio de Janeiro, RJ</td>
                  <td className="border p-2 bg-blue-50">Belo Horizonte, MG</td>
                  <td className="border p-2 bg-purple-50"></td>
                  <td className="border p-2 bg-orange-50">50</td>
                  <td className="border p-2 bg-orange-50">25.50</td>
                  <td className="border p-2">400.00</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>
              <span className="text-orange-600">■</span> <strong>Laranja:</strong> Campos de cálculo (quantidade ×
              valor)
            </p>
            <p>
              <strong>Receita Total:</strong> 50 × R$ 25,50 = R$ 1.275,00
            </p>
            <p>
              <strong>*</strong> Campos obrigatórios
            </p>
          </div>
        </div>

        {/* Exemplo de cálculo */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">🧮 Exemplo de Cálculo Automático:</h4>
          <div className="text-sm text-green-700 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>📦 Entrada:</strong>
                </p>
                <ul className="ml-4 space-y-1">
                  <li>• 50 pacotes</li>
                  <li>• R$ 25,50 por pacote</li>
                  <li>• R$ 400,00 outros custos</li>
                  <li>• 2 destinos</li>
                </ul>
              </div>
              <div>
                <p>
                  <strong>💰 Cálculos:</strong>
                </p>
                <ul className="ml-4 space-y-1">
                  <li>• Receita: 50 × R$ 25,50 = R$ 1.275,00</li>
                  <li>• Combustível: Calculado automaticamente</li>
                  <li>• Custo Total: R$ 400,00 + combustível</li>
                  <li>• Lucro: Receita - Custo Total</li>
                  <li>• Margem: (Lucro ÷ Receita) × 100</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Regras importantes */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Regras do Sistema:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • <strong>Fórmula base:</strong> Receita Total = Quantidade de Pacotes × Valor por Pacote
            </li>
            <li>
              • <strong>Distribuição:</strong> Pacotes divididos igualmente entre destinos
            </li>
            <li>
              • <strong>Combustível:</strong> Calculado automaticamente baseado na origem
            </li>
            <li>
              • <strong>Análises:</strong> Lucro, margem e métricas calculadas automaticamente
            </li>
            <li>
              • <strong>Outros custos:</strong> Pedágios, alimentação, hospedagem (sem combustível)
            </li>
          </ul>
        </div>
      </CardContent>
      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Importação Concluída!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>{importedCount} rota(s) foram importadas com sucesso.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
