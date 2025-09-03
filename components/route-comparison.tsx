"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, BarChart3, Zap, Lightbulb, Target, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react"
import PDFExport from "./pdf-export"
import { Input } from "@/components/ui/input" // Import Input component

interface RouteHistoryItem {
  id: number
  date: string
  driver: string
  origin: string
  destination: string
  distance: number
  totalRevenue: number
  profit: number
  profitMargin: number
  routeCost: number
  travelTime: number
  totalDistance?: number
  totalPackages?: number
  packageCount?: number
  valuePerPackage?: number
}

interface ComparisonRoute {
  name: string
  driver: string
  profit: number
  margin: number
  revenue: number
  distance: number
  efficiency: number
  profitPerHour: number
  cost: number
  packages: number
  valuePerPackage: number
  costPerKm: number
  revenuePerPackage: number
}

interface ImprovementSuggestion {
  type: "pricing" | "cost" | "efficiency" | "volume"
  title: string
  description: string
  impact: string
  difficulty: "easy" | "medium" | "hard"
  potentialGain: number
}

export default function RouteComparison() {
  const [history, setHistory] = useState<RouteHistoryItem[]>([])
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonRoute[]>([])
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([])
  const [searchTerm, setSearchTerm] = useState("") // New state for search term

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("routeHistory") || "[]")
    setHistory(savedHistory)
  }, [])

  useEffect(() => {
    const selected = history.filter((route) => selectedRoutes.includes(route.id))
    const comparison = selected.map((route) => ({
      name: `${route.origin} → ${route.destination}`,
      driver: route.driver,
      profit: route.profit,
      margin: route.profitMargin,
      revenue: route.totalRevenue,
      distance: route.totalDistance || route.distance,
      efficiency: route.totalRevenue / (route.totalDistance || route.distance), // Receita por KM
      profitPerHour: route.profit / (route.travelTime || 1),
      cost: route.routeCost,
      packages: route.totalPackages || route.packageCount || 0,
      valuePerPackage: route.valuePerPackage || route.totalRevenue / (route.totalPackages || route.packageCount || 1),
      costPerKm: route.routeCost / (route.totalDistance || route.distance),
      revenuePerPackage: route.totalRevenue / (route.totalPackages || route.packageCount || 1),
    }))

    setComparisonData(comparison)

    // Gerar sugestões de melhoria
    if (comparison.length >= 2) {
      const suggestions = generateImprovementSuggestions(comparison)
      setImprovementSuggestions(suggestions)
    } else {
      setImprovementSuggestions([])
    }
  }, [selectedRoutes, history])

  const generateImprovementSuggestions = (routes: ComparisonRoute[]): ImprovementSuggestion[] => {
    const bestRoute = routes.reduce((best, current) => (current.profit > best.profit ? current : best))
    const worstRoute = routes.reduce((worst, current) => (current.profit < worst.profit ? current : worst))

    if (bestRoute === worstRoute) return []

    const suggestions: ImprovementSuggestion[] = []

    // Sugestão de preço
    if (bestRoute.valuePerPackage > worstRoute.valuePerPackage) {
      const priceDiff = bestRoute.valuePerPackage - worstRoute.valuePerPackage
      const potentialGain = priceDiff * worstRoute.packages

      suggestions.push({
        type: "pricing",
        title: "Ajustar Preço por Pacote",
        description: `Aumentar o valor por pacote de R$ ${worstRoute.valuePerPackage.toFixed(2)} para R$ ${bestRoute.valuePerPackage.toFixed(2)} (diferença de R$ ${priceDiff.toFixed(2)})`,
        impact: `Aumento potencial de R$ ${potentialGain.toFixed(2)} na receita`,
        difficulty: "easy",
        potentialGain: potentialGain,
      })
    }

    // Sugestão de redução de custos
    if (worstRoute.costPerKm > bestRoute.costPerKm) {
      const costDiff = worstRoute.costPerKm - bestRoute.costPerKm
      const potentialSaving = costDiff * worstRoute.distance

      suggestions.push({
        type: "cost",
        title: "Otimizar Custos Operacionais",
        description: `Reduzir custo por km de R$ ${worstRoute.costPerKm.toFixed(2)} para R$ ${bestRoute.costPerKm.toFixed(2)} (economia de R$ ${costDiff.toFixed(2)}/km)`,
        impact: `Economia potencial de R$ ${potentialSaving.toFixed(2)} nos custos`,
        difficulty: "medium",
        potentialGain: potentialSaving,
      })
    }

    // Sugestão de eficiência
    if (bestRoute.efficiency > worstRoute.efficiency) {
      const efficiencyGap = bestRoute.efficiency - worstRoute.efficiency
      const potentialGain = efficiencyGap * worstRoute.distance

      suggestions.push({
        type: "efficiency",
        title: "Melhorar Eficiência da Rota",
        description: `Aumentar receita por km de R$ ${worstRoute.efficiency.toFixed(2)} para R$ ${bestRoute.efficiency.toFixed(2)}`,
        impact: `Potencial aumento de R$ ${potentialGain.toFixed(2)} na receita`,
        difficulty: "medium",
        potentialGain: potentialGain,
      })
    }

    // Sugestão de volume
    if (bestRoute.packages > worstRoute.packages) {
      const packageDiff = bestRoute.packages - worstRoute.packages
      const potentialGain = packageDiff * worstRoute.valuePerPackage

      suggestions.push({
        type: "volume",
        title: "Aumentar Volume de Pacotes",
        description: `Aumentar de ${worstRoute.packages} para ${bestRoute.packages} pacotes (diferença de ${packageDiff} pacotes)`,
        impact: `Aumento potencial de R$ ${potentialGain.toFixed(2)} na receita`,
        difficulty: "hard",
        potentialGain: potentialGain,
      })
    }

    return suggestions.sort((a, b) => b.potentialGain - a.potentialGain).slice(0, 4)
  }

  const toggleRoute = (routeId: number) => {
    setSelectedRoutes(
      (prev) => (prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId].slice(-5)), // Máximo 5 rotas
    )
  }

  const getBestPerformer = (metric: string) => {
    if (comparisonData.length === 0) return null
    return comparisonData.reduce((best, current) =>
      current[metric as keyof ComparisonRoute] > best[metric as keyof ComparisonRoute] ? current : best,
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Fácil"
      case "medium":
        return "Médio"
      case "hard":
        return "Difícil"
      default:
        return "N/A"
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "pricing":
        return <Target className="h-5 w-5" />
      case "cost":
        return <TrendingUp className="h-5 w-5" />
      case "efficiency":
        return <Zap className="h-5 w-5" />
      case "volume":
        return <BarChart3 className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  // Filter history based on search term
  const filteredHistory = history.filter((route) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      route.driver.toLowerCase().includes(lowerCaseSearchTerm) ||
      route.origin.toLowerCase().includes(lowerCaseSearchTerm) ||
      route.destination.toLowerCase().includes(lowerCaseSearchTerm)
    )
  })

  return (
    <div className="space-y-6">
      {/* Seleção de Rotas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#fa3a2f]" />
                Selecionar Rotas para Comparação
              </CardTitle>
              <p className="text-sm text-gray-500">
                Selecione até 5 rotas para comparar performance (selecionadas: {selectedRoutes.length}/5)
              </p>
            </div>
            {comparisonData.length > 0 && (
              <PDFExport
                data={{
                  title: "Relatório de Comparação de Rotas",
                  data: comparisonData,
                  type: "comparison",
                }}
              />
            )}
          </div>
          {/* Search Input */}
          <Input
            type="text"
            placeholder="Pesquisar por motorista, origem ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((route) => (
                <div key={route.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`route-${route.id}`}
                    checked={selectedRoutes.includes(route.id)}
                    onCheckedChange={() => toggleRoute(route.id)}
                    disabled={!selectedRoutes.includes(route.id) && selectedRoutes.length >= 5}
                  />
                  <label htmlFor={`route-${route.id}`} className="flex-1 cursor-pointer">
                    <div className="text-sm">
                      <p className="font-medium">{route.driver}</p>
                      <p className="text-gray-500">
                        {route.origin} → {route.destination}
                      </p>
                      <p className="text-xs text-gray-400">
                        Lucro: R$ {route.profit.toFixed(2)} | Margem: {route.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </label>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-4">
                Nenhuma rota encontrada com o termo de pesquisa.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {comparisonData.length > 0 && (
        <>
          {/* Resumo de Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Maior Lucro</p>
                <p className="font-bold">{getBestPerformer("profit")?.driver}</p>
                <p className="text-green-600">R$ {getBestPerformer("profit")?.profit.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Badge className="bg-blue-500 mb-2">
                  <Zap className="h-4 w-4 mr-1" />
                  Melhor Margem
                </Badge>
                <p className="font-bold">{getBestPerformer("margin")?.driver}</p>
                <p className="text-blue-600">{getBestPerformer("margin")?.margin.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 p-2 rounded-full w-fit mx-auto mb-2">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Mais Eficiente</p>
                <p className="font-bold">{getBestPerformer("efficiency")?.driver}</p>
                <p className="text-purple-600">R$ {getBestPerformer("efficiency")?.efficiency.toFixed(2)}/km</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Comparação e Sugestões */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Lucro"]} />
                    <Bar dataKey="profit" fill="#fa3a2f" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sugestões de Melhoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Sugestões de Melhoria
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Baseado na rota mais lucrativa: <strong>{getBestPerformer("profit")?.name}</strong>
                </p>
              </CardHeader>
              <CardContent>
                {improvementSuggestions.length > 0 ? (
                  <div className="space-y-4">
                    {improvementSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            {getSuggestionIcon(suggestion.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-800">{suggestion.title}</h4>
                              <Badge className={getDifficultyColor(suggestion.difficulty)}>
                                {getDifficultyText(suggestion.difficulty)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">{suggestion.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Resumo do Potencial Total */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">Potencial Total de Melhoria</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-2">
                        Implementando todas as sugestões, você pode aumentar o lucro em até:
                      </p>
                      <p className="text-2xl font-bold text-green-800">
                        R$ {improvementSuggestions.reduce((sum, s) => sum + s.potentialGain, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        *Valores estimados baseados na comparação com a melhor rota
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Selecione pelo menos 2 rotas para gerar sugestões de melhoria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rota</th>
                      <th className="text-left p-2">Motorista</th>
                      <th className="text-right p-2">Receita</th>
                      <th className="text-right p-2">Custo</th>
                      <th className="text-right p-2">Lucro</th>
                      <th className="text-right p-2">Margem</th>
                      <th className="text-right p-2">R$/km</th>
                      <th className="text-right p-2">R$/hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((route, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{route.name}</td>
                        <td className="p-2">{route.driver}</td>
                        <td className="p-2 text-right">R$ {route.revenue.toFixed(2)}</td>
                        <td className="p-2 text-right text-orange-600">R$ {route.cost.toFixed(2)}</td>
                        <td className="p-2 text-right text-green-600">R$ {route.profit.toFixed(2)}</td>
                        <td className="p-2 text-right">{route.margin.toFixed(1)}%</td>
                        <td className="p-2 text-right">R$ {route.efficiency.toFixed(2)}</td>
                        <td className="p-2 text-right">R$ {route.profitPerHour.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {comparisonData.length === 0 && selectedRoutes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Selecione rotas acima para começar a comparação</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
