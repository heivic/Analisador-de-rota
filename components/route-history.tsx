"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import PDFExport from "./pdf-export"

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
  totalPackages?: number
  packageCount?: number
  valuePerPackage?: number
  destinations?: { city: string; packages: number; valuePerPackage: number }[]
  totalDistance?: number
}

export default function RouteHistory() {
  const [history, setHistory] = useState<RouteHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<RouteHistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const routesPerPage = 15 // Limite de rotas por página

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("routeHistory") || "[]")
    setHistory(savedHistory)
    setFilteredHistory(savedHistory)
    setCurrentPage(1) // Resetar para a primeira página ao carregar ou filtrar
  }, [])

  useEffect(() => {
    const filtered = history.filter(
      (route) =>
        route.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredHistory(filtered)
    setCurrentPage(1) // Resetar para a primeira página ao filtrar
  }, [searchTerm, history])

  // Lógica de Paginação
  const indexOfLastRoute = currentPage * routesPerPage
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage
  const currentRoutes = filteredHistory.slice(indexOfFirstRoute, indexOfLastRoute)
  const totalPages = Math.ceil(filteredHistory.length / routesPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const clearHistory = () => {
    localStorage.removeItem("routeHistory")
    setHistory([])
    setFilteredHistory([])
    setCurrentPage(1) // Resetar página
  }

  const deleteRoute = (id: number) => {
    const updatedHistory = history.filter((route) => route.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("routeHistory", JSON.stringify(updatedHistory))
    // Ajustar a página se a última rota da página atual for excluída
    if (currentRoutes.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const getProfitabilityBadge = (margin: number) => {
    if (margin >= 30) return <Badge className="bg-green-500">Excelente</Badge>
    if (margin >= 20) return <Badge className="bg-blue-500">Boa</Badge>
    if (margin >= 10) return <Badge className="bg-yellow-500">Regular</Badge>
    return <Badge className="bg-red-500">Baixa</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#fa3a2f]" />
              Histórico de Rotas ({filteredHistory.length})
            </CardTitle>
            <div className="flex gap-2">
              <PDFExport
                data={{
                  title: "Relatório do Histórico de Rotas",
                  data: filteredHistory,
                  type: "history",
                }}
                className="text-sm"
              />
              <Button onClick={clearHistory} variant="destructive" size="sm" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Limpar Histórico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por motorista, origem ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de rotas */}
      <div className="space-y-4">
        {currentRoutes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {history.length === 0 ? "Nenhuma rota calculada ainda" : "Nenhuma rota encontrada"}
              </p>
            </CardContent>
          </Card>
        ) : (
          currentRoutes.map((route) => (
            <Card key={route.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{route.driver}</h3>
                    <p className="text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {route.origin} → {route.destination}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(route.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProfitabilityBadge(route.profitMargin)}
                    <Button
                      onClick={() => deleteRoute(route.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Detalhes dos Pacotes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">📦 Detalhes dos Pacotes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Quantidade Total:</span>
                      <Badge variant="outline" className="bg-blue-50">
                        {route.totalPackages || route.packageCount || 0} pacotes
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Valor por Pacote:</span>
                      <Badge variant="outline" className="bg-green-50">
                        R${" "}
                        {(
                          route.valuePerPackage || route.totalRevenue / (route.totalPackages || route.packageCount || 1)
                        ).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Receita Total:</span>
                      <Badge variant="outline" className="bg-purple-50">
                        R$ {route.totalRevenue.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Receita/Pacote:</span>
                      <Badge variant="outline" className="bg-orange-50">
                        R$ {(route.totalRevenue / (route.totalPackages || route.packageCount || 1)).toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  {/* Detalhes por destino se disponível */}
                  {route.destinations && Array.isArray(route.destinations) && route.destinations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="font-medium text-xs text-gray-600 mb-2">Distribuição por Destino:</h5>
                      <div className="space-y-1">
                        {route.destinations.map((dest, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{dest.city}:</span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs py-0">
                                {dest.packages} pct
                              </Badge>
                              <Badge variant="outline" className="text-xs py-0">
                                R$ {dest.valuePerPackage.toFixed(2)}
                              </Badge>
                              <Badge variant="outline" className="text-xs py-0 bg-green-50">
                                R$ {(dest.packages * dest.valuePerPackage).toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Distância</p>
                    <p className="font-semibold">{route.distance || route.totalDistance} km</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Receita</p>
                    <p className="font-semibold text-green-600">R$ {route.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Custo</p>
                    <p className="font-semibold text-orange-600">R$ {(route.routeCost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lucro</p>
                    <p className={`font-semibold ${route.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      R$ {route.profit.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Margem</p>
                    <p className="font-semibold">{route.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Métricas Adicionais */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                    <div>
                      <span>Lucro/Pacote:</span>
                      <span className="font-medium ml-1">
                        R$ {(route.profit / (route.totalPackages || route.packageCount || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span>Receita/KM:</span>
                      <span className="font-medium ml-1">
                        R$ {(route.totalRevenue / (route.distance || route.totalDistance || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span>Custo Operacional/KM:</span> {/* Changed label here */}
                      <span className="font-medium ml-1">
                        R$ {((route.routeCost || 0) / (route.distance || route.totalDistance || 1)).toFixed(2)}{" "}
                        {/* Changed calculation here */}
                      </span>
                    </div>
                    <div>
                      <span>Eficiência:</span>
                      <span className="font-medium ml-1">
                        {(route.totalRevenue / (route.routeCost || 1)).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Controles de Paginação */}
      {filteredHistory.length > routesPerPage && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
