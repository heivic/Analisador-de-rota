"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from "recharts"
import {
  TrendingUp,
  DollarSign,
  MapPin,
  BarChart3,
  Package,
  Trophy,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import PDFExport from "./pdf-export"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs

interface RouteHistoryItem {
  id: number
  date: string
  driver: string
  origin: string
  destination: string
  destinations?: Array<{ city: string }>
  distance: number
  totalDistance?: number
  totalRevenue: number
  profit: number
  profitMargin: number
  routeCost: number
  fuelCost?: number
  totalCost?: number
  totalPackages?: number
  packageCount?: number
}

interface RouteTypeAnalysis {
  routeType: string
  count: number
  totalRevenue: number
  totalProfit: number
  totalCost: number
  averageMargin: number
  averageDistance: number
}

interface WeeklyData {
  week: string
  weekNumber: number
  revenue: number
  profit: number
  routes: number
  averageMargin: number
  totalDistance: number
}

// Nova interface para rotas agregadas no ranking
interface AggregatedRouteForRanking {
  key: string // Combinação de motorista e rota
  driver: string
  routeName: string
  totalPackages: number
  totalRevenue: number
  totalProfit: number
  profitMargin: number // Recalculada após agregação
}

export default function ProfitabilityDashboard() {
  const [sortColumn, setSortColumn] = useState<keyof RouteTypeAnalysis | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [history, setHistory] = useState<RouteHistoryItem[]>([])
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageMargin: 0,
    totalPackagesTransported: 0,
    averageValuePerPackageProfit: 0,
    bestWeek: null as WeeklyData | null,
    worstWeek: null as WeeklyData | null,
  })

  const [routeTypeAnalysis, setRouteTypeAnalysis] = useState<RouteTypeAnalysis[]>([])
  const [losingRouteTypes, setLosingRouteTypes] = useState<RouteTypeAnalysis[]>([])
  const [innerTab, setInnerTab] = useState("overview")

  // Novos estados para as rotas agregadas no ranking
  const [topVolumeRoutesAggregated, setTopVolumeRoutesAggregated] = useState<AggregatedRouteForRanking[]>([])
  const [topProfitRoutesAggregated, setTopProfitRoutesAggregated] = useState<AggregatedRouteForRanking[]>([])

  const handleSort = (column: keyof RouteTypeAnalysis) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("routeHistory") || "[]")
    setHistory(saved)
  }, [])

  // 2) Recalcula métricas sempre que `history` mudar
  useEffect(() => {
    if (history.length === 0) {
      // resetar estados derivados
      setStats({
        totalRoutes: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageMargin: 0,
        totalPackagesTransported: 0,
        averageValuePerPackageProfit: 0,
        bestWeek: null,
        worstWeek: null,
      })
      setRouteTypeAnalysis([])
      setLosingRouteTypes([])
      setTopVolumeRoutesAggregated([])
      setTopProfitRoutesAggregated([])
      return
    }

    // Estatísticas gerais
    const totalRevenue = history.reduce((sum: number, route: RouteHistoryItem) => sum + route.totalRevenue, 0)
    const totalProfit = history.reduce((sum: number, route: RouteHistoryItem) => sum + route.profit, 0)
    const totalPackagesTransported = history.reduce(
      (sum: number, route: RouteHistoryItem) => sum + (route.totalPackages || route.packageCount || 0),
      0,
    )
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    const averageValuePerPackageProfit = totalPackagesTransported > 0 ? totalProfit / totalPackagesTransported : 0

    // Análise por tipo de rota (origem → destino)
    const routeTypes = history.reduce((acc: any, route) => {
      const routeKey = `${route.origin} → ${route.destination || route.destinations?.map((d) => d.city).join(" → ") || "N/A"}`

      if (!acc[routeKey]) {
        acc[routeKey] = {
          routeType: routeKey,
          count: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalCost: 0,
          totalDistance: 0,
          margins: [],
        }
      }

      acc[routeKey].count += 1
      acc[routeKey].totalRevenue += route.totalRevenue
      acc[routeKey].totalProfit += route.profit
      acc[routeKey].totalCost += route.routeCost || 0
      acc[routeKey].totalDistance += route.totalDistance || route.distance
      acc[routeKey].margins.push(route.profitMargin)

      return acc
    }, {})

    const routeTypeAnalysis = Object.values(routeTypes)
      .map((type: any) => ({
        ...type,
        averageMargin: type.totalRevenue > 0 ? (type.totalProfit / type.totalRevenue) * 100 : 0,
        averageDistance: type.totalDistance / type.count,
      }))
      .sort((a: any, b: any) => b.count - a.count)

    // Filtrar tipos de rota com lucro total negativo
    const negativeProfitRouteTypes = routeTypeAnalysis.filter(
      (routeType: RouteTypeAnalysis) => routeType.totalProfit < 0,
    )
    setLosingRouteTypes(negativeProfitRouteTypes)

    setStats({
      totalRoutes: history.length,
      totalRevenue,
      totalProfit,
      averageMargin,
      totalPackagesTransported,
      averageValuePerPackageProfit,
      bestWeek: null,
      worstWeek: null,
    })

    setRouteTypeAnalysis(routeTypeAnalysis)

    // Lógica de agregação para os rankings de performance
    const aggregatedRoutesMap: {
      [key: string]: {
        driver: string
        routeName: string
        totalPackages: number
        totalRevenue: number
        totalProfit: number
      }
    } = {}

    history.forEach((route: RouteHistoryItem) => {
      const routeName = `${route.origin} → ${route.destination || route.destinations?.map((d) => d.city).join(" → ") || "N/A"}`
      const uniqueKey = `${route.driver}-${routeName}` // Chave única: motorista + rota

      if (!aggregatedRoutesMap[uniqueKey]) {
        aggregatedRoutesMap[uniqueKey] = {
          driver: route.driver,
          routeName: routeName,
          totalPackages: 0,
          totalRevenue: 0,
          totalProfit: 0,
        }
      }
      aggregatedRoutesMap[uniqueKey].totalPackages += route.totalPackages || route.packageCount || 0
      aggregatedRoutesMap[uniqueKey].totalRevenue += route.totalRevenue
      aggregatedRoutesMap[uniqueKey].totalProfit += route.profit
    })

    const finalAggregatedRoutes: AggregatedRouteForRanking[] = Object.values(aggregatedRoutesMap).map((aggRoute) => ({
      ...aggRoute,
      profitMargin: aggRoute.totalRevenue > 0 ? (aggRoute.totalProfit / aggRoute.totalRevenue) * 100 : 0,
    }))

    // Calcular top 5 por volume
    const sortedByVolume = [...finalAggregatedRoutes].sort((a, b) => b.totalPackages - a.totalPackages).slice(0, 5)
    setTopVolumeRoutesAggregated(sortedByVolume)

    // Calcular top 5 por lucro
    const sortedByProfit = [...finalAggregatedRoutes].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5)
    setTopProfitRoutesAggregated(sortedByProfit)
  }, [history])

  const exportData = {
    title: "Dashboard de Rentabilidade - Análise Avançada",
    data: {
      ...stats,
      routeTypeAnalysis,
      totalRoutes: history.length,
      analysisDate: new Date().toLocaleDateString("pt-BR"),
    },
    type: "dashboard" as const,
  }

  return (
    <div className="space-y-8">
      {/* Header com botão de exportação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard de Rentabilidade</h2>
          <p className="text-gray-600 mt-1">Análise completa de performance e rankings das rotas</p>
        </div>
        <PDFExport data={exportData} />
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {" "}
        {/* Adjusted grid */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total de Rotas</p>
                <p className="text-3xl font-bold text-red-700">{stats.totalRoutes}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Receita Total</p>
                <p className="text-3xl font-bold text-green-700">R$ {stats.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Lucro Total</p>
                <p className="text-3xl font-bold text-blue-700">R$ {stats.totalProfit.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Margem de Lucro</p>
                <p className="text-3xl font-bold text-purple-700">{stats.averageMargin.toFixed(1)}%</p>
              </div>
              <Badge
                className={`${stats.averageMargin >= 25 ? "bg-green-500" : stats.averageMargin >= 15 ? "bg-yellow-500" : "bg-red-500"}`}
              >
                {stats.averageMargin >= 25 ? "Excelente" : stats.averageMargin >= 15 ? "Boa" : "Regular"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        {/* Nova métrica: Quantidade Total de Pacotes Transportados */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total de Pacotes</p>
                <p className="text-3xl font-bold text-orange-700">{stats.totalPackagesTransported.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Nova métrica: Média de Valor por Pacote (Lucro) */}
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600 font-medium">Lucro Médio/Pacote</p>
                <p className="text-3xl font-bold text-teal-700">R$ {stats.averageValuePerPackageProfit.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-teal-200 rounded-full">
                <Award className="h-8 w-8 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Internas do Dashboard */}
      <Tabs value={innerTab} onValueChange={setInnerTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed-analysis">Análise Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Rankings de Performance - Seção Principal */}
          <Card className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">🏆 Rankings de Performance</CardTitle>
                    <p className="text-blue-100 text-sm">Top 5 rotas por volume de pacotes e lucratividade</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Ranking: Maior Volume de Pacotes */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-600 rounded-full shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800">📦 Top 5 - Maior Volume</h3>
                      <p className="text-blue-600 text-sm">Rotas com mais pacotes transportados</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {topVolumeRoutesAggregated.length > 0 ? (
                      topVolumeRoutesAggregated.map((route, index) => (
                        <div
                          key={route.key} // Usar a chave agregada
                          className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                      : "bg-gradient-to-br from-blue-400 to-blue-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-lg">{route.driver}</p>
                              <p
                                className="text-gray-600 text-sm font-medium max-w-[280px] truncate"
                                title={route.routeName}
                              >
                                {route.routeName}
                              </p>
                              {/* Data da rota individual não faz sentido aqui, pois é agregada */}
                              {/* <p className="text-gray-500 text-xs">
                                {new Date(route.date).toLocaleDateString("pt-BR")}
                              </p> */}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <Package className="h-5 w-5 text-blue-600" />
                              <span className="font-bold text-2xl text-blue-700">{route.totalPackages}</span>
                            </div>
                            <p className="text-blue-600 text-sm font-medium">pacotes</p>
                            <Badge variant="outline" className="text-xs mt-2 bg-blue-50 border-blue-300">
                              R$ {route.totalRevenue.toFixed(0)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Nenhuma rota encontrada</p>
                        <p className="text-sm">Calcule algumas rotas para ver o ranking</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ranking: Maior Lucratividade */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-600 rounded-full shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800">💰 Top 5 - Maior Lucro</h3>
                      <p className="text-green-600 text-sm">Rotas mais lucrativas do período</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {topProfitRoutesAggregated.length > 0 ? (
                      topProfitRoutesAggregated.map((route, index) => (
                        <div
                          key={route.key} // Usar a chave agregada
                          className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                      : "bg-gradient-to-br from-green-400 to-green-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-lg">{route.driver}</p>
                              <p
                                className="text-gray-600 text-sm font-medium max-w-[280px] truncate"
                                title={route.routeName}
                              >
                                {route.routeName}
                              </p>
                              {/* Data da rota individual não faz sentido aqui, pois é agregada */}
                              {/* <p className="text-gray-500 text-xs">
                                {new Date(route.date).toLocaleDateString("pt-BR")}
                              </p> */}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="font-bold text-xl text-green-700">
                                R$ {route.totalProfit.toFixed(0)}
                              </span>
                            </div>
                            <p className="text-green-600 text-sm font-medium">lucro</p>
                            <Badge
                              className={`text-xs mt-2 ${
                                route.profitMargin >= 30
                                  ? "bg-green-500 text-white"
                                  : route.profitMargin >= 20
                                    ? "bg-blue-500 text-white"
                                    : route.profitMargin >= 10
                                      ? "bg-yellow-500 text-white"
                                      : "bg-red-500 text-white"
                              }`}
                            >
                              {route.profitMargin.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Nenhuma rota encontrada</p>
                        <p className="text-sm">Calcule algumas rotas para ver o ranking</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alerta de Rotas com Prejuízo (agregado por tipo de rota) */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h4 className="text-xl font-bold text-gray-800">🚨 Rotas que Precisam de Atenção</h4>
                </div>
                {losingRouteTypes.length > 0 ? (
                  <div className="space-y-4">
                    {losingRouteTypes.map((routeType) => (
                      <div
                        key={routeType.routeType}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-600 rounded-full">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-red-800 text-lg">{routeType.routeType}</p>
                            <p className="text-red-600 text-sm font-medium">
                              {routeType.count} viagens com prejuízo total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-2xl text-red-700">R$ {routeType.totalProfit.toFixed(2)}</span>
                          <p className="text-red-600 text-sm font-medium">prejuízo total</p>
                          <Badge className="bg-red-500 text-white text-xs mt-2">
                            Margem de Lucro: {routeType.averageMargin.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-green-500" />
                    <p className="text-lg">🎉 Ótimo trabalho!</p>
                    <p className="text-sm">Nenhuma rota com prejuízo encontrada no momento.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed-analysis">
          {/* Análise por Tipo de Rota - Gráfico e Tabela Detalhada */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Análise Detalhada por Tipo de Rota
              </CardTitle>
              <p className="text-gray-300 text-sm">Performance completa de cada rota realizada</p>
            </CardHeader>
            <CardContent className="p-6">
              {routeTypeAnalysis.length > 0 ? (
                <div className="space-y-8">
                  {" "}
                  {/* Changed from grid to space-y to stack vertically */}
                  {/* Gráfico de Quantidade vs Margem */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">📈 Quantidade vs Margem de Lucro</h4>
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={routeTypeAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="routeType"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={10}
                          interval={0}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "count") return [value, "Quantidade de Rotas"]
                            if (name === "averageMargin") return [`${Number(value).toFixed(1)}%`, "Margem de Lucro"]
                            return [value, name]
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" fill="#fa3a2f" name="Quantidade" />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="averageMargin"
                          stroke="#10b981"
                          strokeWidth={3}
                          name="Margem %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Tabela Detalhada de Análise por Tipo de Rota */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">📋 Detalhes das Rotas</h4>
                    <div className="overflow-x-auto">
                      {" "}
                      {/* Removed max-h-[350px] */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-semibold">Tipo de Rota</th>
                            <th
                              className="text-center p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("count")}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Quantidade
                                {sortColumn === "count" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th
                              className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("totalRevenue")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Receita Total
                                {sortColumn === "totalRevenue" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th
                              className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("totalCost")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Custo Total
                                {sortColumn === "totalCost" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th
                              className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("totalProfit")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Lucro Total
                                {sortColumn === "totalProfit" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th
                              className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("averageMargin")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Margem de Lucro
                                {sortColumn === "averageMargin" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th
                              className="text-right p-3 font-semibold cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("averageDistance")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Dist. Média
                                {sortColumn === "averageDistance" &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                            <th className="text-center p-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const sortedData = [...routeTypeAnalysis].sort((a, b) => {
                              if (!sortColumn) return 0

                              const aValue = a[sortColumn]
                              const bValue = b[sortColumn]

                              if (typeof aValue === "string" && typeof bValue === "string") {
                                return sortDirection === "asc"
                                  ? aValue.localeCompare(bValue)
                                  : bValue.localeCompare(aValue)
                              } else if (typeof aValue === "number" && typeof bValue === "number") {
                                return sortDirection === "asc" ? aValue - bValue : bValue - aValue
                              }
                              return 0
                            })

                            return sortedData.map((route, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium max-w-xs truncate" title={route.routeType}>
                                  {route.routeType}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge variant="outline">{route.count}x</Badge>
                                </td>
                                <td className="p-3 text-right font-semibold text-green-600">
                                  R$ {route.totalRevenue.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-semibold text-orange-600">
                                  R$ {route.totalCost.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-semibold text-blue-600">
                                  R$ {route.totalProfit.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-semibold">{route.averageMargin.toFixed(1)}%</td>
                                <td className="p-3 text-right">{route.averageDistance.toFixed(0)} km</td>
                                <td className="p-3 text-center">
                                  <Badge
                                    className={`${
                                      route.averageMargin >= 25
                                        ? "bg-green-500"
                                        : route.averageMargin >= 15
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                  >
                                    {route.averageMargin >= 25
                                      ? "Excelente"
                                      : route.averageMargin >= 15
                                        ? "Boa"
                                        : "Regular"}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Nenhuma análise disponível</p>
                  <p className="text-sm">Calcule algumas rotas para ver a análise detalhada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
