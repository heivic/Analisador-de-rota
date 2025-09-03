"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Route,
  Fuel,
  FileSpreadsheet,
} from "lucide-react"
import PDFExport from "./pdf-export"
import ExcelImport from "./excel-import"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Destination {
  id: string
  city: string
  packages: number
  valuePerPackage: number
}

interface FuelAnalysis {
  region: string
  diesel: {
    fuelPrice: number
    consumption: number
    fuelCost: number
    costPerKm: number
  }
  gasoline: {
    fuelPrice: number
    consumption: number
    fuelCost: number
    costPerKm: number
  }
  recommendation: "diesel" | "gasoline"
  savings: number
}

interface RouteData {
  driver: string
  origin: string
  destinations: Destination[]
  totalDistance: number
  totalTravelTime: number
  totalPackages: number
  totalRevenue: number
  routeCost: number
  fuelCost: number
  fuelAnalysis: FuelAnalysis | null
  totalCost: number
  profit: number
  profitMargin: number
  distanceBreakdown: { from: string; to: string; distance: number }[]
}

interface ProcessedRoute {
  driver: string
  origin: string
  destinations: Destination[]
  routeCost: number
}

// Mapeamento de cidades para estados (principais cidades)
const cityToState: Record<string, string> = {
  // São Paulo
  "são paulo": "São Paulo",
  santos: "São Paulo",
  campinas: "São Paulo",
  sorocaba: "São Paulo",
  "ribeirão preto": "São Paulo",
  "santo andré": "São Paulo",
  osasco: "São Paulo",
  guarulhos: "São Paulo",

  // Rio de Janeiro
  "rio de janeiro": "Rio de Janeiro",
  niterói: "Rio de Janeiro",
  "nova iguaçu": "Rio de Janeiro",
  "duque de caxias": "Rio de Janeiro",
  campos: "Rio de Janeiro",

  // Minas Gerais
  "belo horizonte": "Minas Gerais",
  uberlândia: "Minas Gerais",
  contagem: "Minas Gerais",
  "juiz de fora": "Minas Gerais",
  betim: "Minas Gerais",

  // Rio Grande do Sul
  "porto alegre": "Rio Grande do Sul",
  "caxias do sul": "Rio Grande do Sul",
  pelotas: "Rio Grande do Sul",
  canoas: "Rio Grande do Sul",
  "santa maria": "Rio Grande do Sul",

  // Paraná
  curitiba: "Paraná",
  londrina: "Paraná",
  maringá: "Paraná",
  "ponta grossa": "Paraná",
  cascavel: "Paraná",

  // Bahia
  salvador: "Bahia",
  "feira de santana": "Bahia",
  "vitória da conquista": "Bahia",
  camaçari: "Bahia",
  itabuna: "Bahia",

  // Santa Catarina
  florianópolis: "Santa Catarina",
  joinville: "Santa Catarina",
  blumenau: "Santa Catarina",
  "são josé": "Santa Catarina",
  criciúma: "Santa Catarina",

  // Goiás
  goiânia: "Goiás",
  "aparecida de goiânia": "Goiás",
  anápolis: "Goiás",
  "rio verde": "Goiás",

  // Pernambuco
  recife: "Pernambuco",
  jaboatão: "Pernambuco",
  olinda: "Pernambuco",
  caruaru: "Pernambuco",
  petrolina: "Pernambuco",

  // Ceará
  fortaleza: "Ceará",
  caucaia: "Ceará",
  "juazeiro do norte": "Ceará",
  maracanaú: "Ceará",
  sobral: "Ceará",

  // Pará
  belém: "Pará",
  ananindeua: "Pará",
  santarém: "Pará",
  marabá: "Pará",

  // Maranhão
  "são luís": "Maranhão",
  imperatriz: "Maranhão",
  timon: "Maranhão",

  // Distrito Federal
  brasília: "Distrito Federal",

  // Amazonas
  manaus: "Amazonas",

  // Mato Grosso
  cuiabá: "Mato Grosso",
  "várzea grande": "Mato Grosso",
  rondonópolis: "Mato Grosso",

  // Espírito Santo
  vitória: "Espírito Santo",
  "vila velha": "Espírito Santo",
  serra: "Espírito Santo",
  cariacica: "Espírito Santo",

  // Paraíba
  "joão pessoa": "Paraíba",
  "campina grande": "Paraíba",

  // Rio Grande do Norte
  natal: "Rio Grande do Norte",
  mossoró: "Rio Grande do Norte",

  // Alagoas
  maceió: "Alagoas",
  arapiraca: "Alagoas",

  // Sergipe
  aracaju: "Sergipe",

  // Piauí
  teresina: "Piauí",
  parnaíba: "Piauí",

  // Mato Grosso do Sul
  "campo grande": "Mato Grosso do Sul",
  dourados: "Mato Grosso do Sul",

  // Acre
  "rio branco": "Acre",

  // Rondônia
  "porto velho": "Rondônia",

  // Roraima
  "boa vista": "Roraima",

  // Amapá
  macapá: "Amapá",

  // Tocantins
  palmas: "Tocantins",
}

// Preços médios de diesel por estado (valores em R$)
const dieselPrices: Record<string, number> = {
  "São Paulo": 5.51,
  "Rio de Janeiro": 5.85,
  "Minas Gerais": 5.68,
  "Rio Grande do Sul": 5.53,
  Paraná: 5.56,
  Bahia: 5.71,
  "Santa Catarina": 5.58,
  Goiás: 5.59,
  Pernambuco: 5.7,
  Ceará: 5.64,
  Pará: 5.92,
  Maranhão: 5.72,
  "Distrito Federal": 5.55,
  Amazonas: 6.01,
  "Mato Grosso": 5.62,
  "Espírito Santo": 5.73,
  Paraíba: 5.63,
  "Rio Grande do Norte": 5.61,
  Alagoas: 5.67,
  Sergipe: 5.67,
  Piauí: 5.74,
  "Mato Grosso do Sul": 5.65,
  Acre: 6.12,
  Rondônia: 5.95,
  Roraima: 6.18,
  Amapá: 5.98,
  Tocantins: 5.76,
}

// Preços médios de gasolina por estado (valores em R$)
const gasolinePrices: Record<string, number> = {
  "São Paulo": 5.89,
  "Rio de Janeiro": 6.23,
  "Minas Gerais": 6.05,
  "Rio Grande do Sul": 5.91,
  Paraná: 5.94,
  Bahia: 6.08,
  "Santa Catarina": 5.96,
  Goiás: 5.97,
  Pernambuco: 6.07,
  Ceará: 6.01,
  Pará: 6.29,
  Maranhão: 6.09,
  "Distrito Federal": 5.93,
  Amazonas: 6.38,
  "Mato Grosso": 5.99,
  "Espírito Santo": 6.1,
  Paraíba: 6.0,
  "Rio Grande do Norte": 5.98,
  Alagoas: 6.04,
  Sergipe: 6.04,
  Piauí: 6.11,
  "Mato Grosso do Sul": 6.02,
  Acre: 6.49,
  Rondônia: 6.32,
  Roraima: 6.55,
  Amapá: 6.35,
  Tocantins: 6.13,
}

// Função para buscar coordenadas usando API de geocoding
async function getCoordinates(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Usando Nominatim (OpenStreetMap) - API gratuita
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", Brasil")}&limit=1`,
    )
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error("Erro ao buscar coordenadas:", error)
    return null
  }
}

// Função para calcular distância real entre duas coordenadas
function calculateRealDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Função para detectar estado baseado na cidade
function detectStateFromCity(city: string): string {
  const normalizedCity = city.toLowerCase().trim()

  // Busca exata primeiro
  if (cityToState[normalizedCity]) {
    return cityToState[normalizedCity]
  }

  // Busca parcial se não encontrar exata
  for (const [cityKey, state] of Object.entries(cityToState)) {
    if (normalizedCity.includes(cityKey) || cityKey.includes(normalizedCity)) {
      return state
    }
  }

  // Retorna São Paulo como padrão (maior estado)
  return "São Paulo"
}

// Função para calcular análise de combustível com diesel e gasolina
function calculateFuelAnalysis(distance: number, originCity: string): FuelAnalysis {
  const state = detectStateFromCity(originCity)
  const dieselPrice = dieselPrices[state] || 5.7 // Preço médio nacional como fallback
  const gasolinePrice = gasolinePrices[state] || 6.0 // Preço médio nacional como fallback

  // Consumo típico para veículos de carga
  const dieselConsumption = 8 // km/l para diesel
  const gasolineConsumption = 6 // km/l para gasolina (menor eficiência)

  // Cálculos para diesel
  const dieselLitersNeeded = distance / dieselConsumption
  const dieselFuelCost = dieselLitersNeeded * dieselPrice
  const dieselCostPerKm = dieselFuelCost / distance

  // Cálculos para gasolina
  const gasolineLitersNeeded = distance / gasolineConsumption
  const gasolineFuelCost = gasolineLitersNeeded * gasolinePrice
  const gasolineCostPerKm = gasolineFuelCost / distance

  // Determinar recomendação e economia
  const recommendation = dieselFuelCost <= gasolineFuelCost ? "diesel" : "gasoline"
  const savings = Math.abs(dieselFuelCost - gasolineFuelCost)

  return {
    region: state,
    diesel: {
      fuelPrice: dieselPrice,
      consumption: dieselLitersNeeded,
      fuelCost: dieselFuelCost,
      costPerKm: dieselCostPerKm,
    },
    gasoline: {
      fuelPrice: gasolinePrice,
      consumption: gasolineLitersNeeded,
      fuelCost: gasolineFuelCost,
      costPerKm: gasolineCostPerKm,
    },
    recommendation,
    savings,
  }
}

export default function RouteCalculator() {
  const [activeTab, setActiveTab] = useState("manual")
  const [formData, setFormData] = useState({
    driver: "",
    origin: "",
    routeCost: "",
  })

  const [destinations, setDestinations] = useState<Destination[]>([
    { id: "1", city: "", packages: 0, valuePerPackage: 0 },
  ])

  const [result, setResult] = useState<RouteData | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [importedRoutes, setImportedRoutes] = useState<ProcessedRoute[]>([])
  const [selectedImportedRoute, setSelectedImportedRoute] = useState<number | null>(null)
  const [showCalculationSuccessDialog, setShowCalculationSuccessDialog] = useState(false)
  const [activeResultTab, setActiveResultTab] = useState("summary") // Novo estado para as abas de resultado

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addDestination = () => {
    const newDestination: Destination = {
      id: Date.now().toString(),
      city: "",
      packages: 0,
      valuePerPackage: 0,
    }
    setDestinations([...destinations, newDestination])
  }

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((dest) => dest.id !== id))
    }
  }

  const updateDestination = (id: string, field: keyof Destination, value: string | number) => {
    setDestinations(destinations.map((dest) => (dest.id === id ? { ...dest, [field]: value } : dest)))
  }

  // Função para lidar com rotas importadas
  const handleRoutesImported = (routes: ProcessedRoute[]) => {
    setImportedRoutes(routes)
    setActiveTab("excel") // Garante que a aba Excel esteja ativa
  }

  // Função para selecionar rota importada
  const selectImportedRoute = (index: number) => {
    const route = importedRoutes[index]
    if (route) {
      setFormData({
        driver: route.driver,
        origin: route.origin,
        routeCost: route.routeCost.toString(),
      })
      setDestinations(route.destinations)
      setSelectedImportedRoute(index)
      setActiveTab("manual") // Mudar para aba manual para edição/cálculo
    }
  }

  // Função principal para calcular a rota, agora aceita dados opcionais
  const calculateRoute = async (routeToProcess?: ProcessedRoute) => {
    const currentDriver = routeToProcess?.driver || formData.driver
    const currentOrigin = routeToProcess?.origin || formData.origin
    const currentDestinations = routeToProcess?.destinations || destinations
    const currentRouteCost =
      routeToProcess?.routeCost !== undefined ? routeToProcess.routeCost : Number(formData.routeCost)

    if (!currentOrigin || currentDestinations.some((dest) => !dest.city)) {
      alert("Por favor, preencha todas as cidades")
      return
    }

    setIsCalculating(true) // Desabilita o botão

    try {
      // Buscar coordenadas de todas as cidades
      const originCoords = await getCoordinates(currentOrigin)
      if (!originCoords) {
        alert(`Não foi possível encontrar a cidade: ${currentOrigin}`)
        setIsCalculating(false)
        return
      }

      const destinationCoords = []
      for (const dest of currentDestinations) {
        const coords = await getCoordinates(dest.city)
        if (!coords) {
          alert(`Não foi possível encontrar a cidade: ${dest.city}`)
          setIsCalculating(false)
          return
        }
        destinationCoords.push({ ...dest, coords })
      }

      // Calcular distâncias entre cada ponto da rota
      const distanceBreakdown: { from: string; to: string; distance: number }[] = []
      let totalDistance = 0

      // Distância da origem para o primeiro destino
      const firstDistance = calculateRealDistance(originCoords, destinationCoords[0].coords)
      distanceBreakdown.push({
        from: currentOrigin,
        to: destinationCoords[0].city,
        distance: firstDistance,
      })
      totalDistance += firstDistance

      // Distâncias entre destinos consecutivos
      for (let i = 0; i < destinationCoords.length - 1; i++) {
        const distance = calculateRealDistance(destinationCoords[i].coords, destinationCoords[i + 1].coords)
        distanceBreakdown.push({
          from: destinationCoords[i].city,
          to: destinationCoords[i + 1].city,
          distance: distance,
        })
        totalDistance += distance
      }

      // Calcular análise de combustível automaticamente
      const fuelAnalysis = calculateFuelAnalysis(totalDistance, currentOrigin)

      // Usar o combustível mais econômico para os cálculos
      const fuelCost =
        fuelAnalysis.recommendation === "diesel" ? fuelAnalysis.diesel.fuelCost : fuelAnalysis.gasoline.fuelCost

      // Calcular totais (remover combustível dos custos)
      const totalPackages = currentDestinations.reduce((sum, dest) => sum + Number(dest.packages), 0)
      const totalRevenue = currentDestinations.reduce(
        (sum, dest) => sum + Number(dest.packages) * Number(dest.valuePerPackage),
        0,
      )
      const totalTravelTime = totalDistance / 60 // 60 km/h
      // Combustível não entra no custo total - apenas informativo
      const totalCost = currentRouteCost // Apenas outros custos
      const profit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      const routeData: RouteData = {
        driver: currentDriver,
        origin: currentOrigin,
        destinations: currentDestinations.map((dest) => ({
          ...dest,
          packages: Number(dest.packages),
          valuePerPackage: Number(dest.valuePerPackage),
        })),
        totalDistance,
        totalTravelTime,
        totalPackages,
        totalRevenue,
        routeCost: currentRouteCost,
        fuelCost,
        fuelAnalysis,
        totalCost,
        profit,
        profitMargin,
        distanceBreakdown,
      }

      setResult(routeData)

      // Salvar no localStorage para histórico
      const history = JSON.parse(localStorage.getItem("routeHistory") || "[]")
      const historyItem = {
        ...routeData,
        id: Date.now(),
        date: new Date().toISOString(),
        // Compatibilidade com formato antigo
        destination: currentDestinations.map((d) => d.city).join(" → "),
        distance: totalDistance,
        travelTime: totalTravelTime,
        packageCount: totalPackages,
        valuePerPackage: totalRevenue / totalPackages || 0,
      }
      history.unshift(historyItem)
      // Aumenta o limite para 500 rotas
      localStorage.setItem("routeHistory", JSON.stringify(history.slice(0, 500)))

      setShowCalculationSuccessDialog(true) // Mostra o diálogo de sucesso
    } catch (error) {
      console.error("Erro ao calcular rota:", error)
      alert("Erro ao calcular a rota. Tente novamente.")
    } finally {
      setIsCalculating(false) // Reabilita o botão
    }
  }

  // Função para calcular rota importada (agora chama calculateRoute diretamente)
  const calculateImportedRoute = async (route: ProcessedRoute) => {
    // Opcional: Atualizar o formulário para refletir a rota importada na UI,
    // mas o cálculo usará os dados passados diretamente.
    setFormData({
      driver: route.driver,
      origin: route.origin,
      routeCost: route.routeCost.toString(),
    })
    setDestinations(route.destinations)
    setSelectedImportedRoute(null) // Limpa a seleção após o cálculo

    await calculateRoute(route) // Passa a rota diretamente para a função de cálculo
  }

  const getProfitabilityStatus = (margin: number) => {
    if (margin >= 30) return { status: "Excelente", color: "bg-green-500", icon: CheckCircle }
    if (margin >= 20) return { status: "Boa", color: "bg-blue-500", icon: TrendingUp }
    if (margin >= 10) return { status: "Regular", color: "bg-yellow-500", icon: AlertTriangle }
    return { status: "Baixa", color: "bg-red-500", icon: AlertTriangle }
  }

  const formatTime = (hours: number): string => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    if (wholeHours === 0) {
      return `${minutes}min`
    } else if (minutes === 0) {
      return `${wholeHours}h`
    } else {
      return `${wholeHours}h ${minutes}min`
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulário */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#fa3a2f]" />
                  Dados da Rota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="driver">Nome do Motorista</Label>
                  <Input
                    id="driver"
                    value={formData.driver}
                    onChange={(e) => handleInputChange("driver", e.target.value)}
                    placeholder="Digite o nome do motorista"
                  />
                </div>

                <div>
                  <Label htmlFor="origin">Cidade de Coleta</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => handleInputChange("origin", e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O preço do combustível será calculado automaticamente baseado nesta cidade
                  </p>
                </div>

                <div>
                  <Label htmlFor="routeCost">Outros Custos da Rota (R$)</Label>
                  <Input
                    id="routeCost"
                    type="number"
                    step="0.01"
                    value={formData.routeCost}
                    onChange={(e) => handleInputChange("routeCost", e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pedágios, alimentação, hospedagem, etc. (combustível calculado automaticamente)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Destinos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-[#fa3a2f]" />
                    Destinos ({destinations.length})
                  </CardTitle>
                  <Button onClick={addDestination} size="sm" className="bg-[#fa3a2f] hover:bg-[#e8342a]">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {destinations.map((destination, index) => (
                  <div key={destination.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Destino {index + 1}</h4>
                      {destinations.length > 1 && (
                        <Button
                          onClick={() => removeDestination(destination.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={destination.city}
                        onChange={(e) => updateDestination(destination.id, "city", e.target.value)}
                        placeholder="Ex: Rio de Janeiro, RJ"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Quantidade de Pacotes</Label>
                        <Input
                          type="number"
                          value={destination.packages}
                          onChange={(e) => updateDestination(destination.id, "packages", Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Valor por Pacote (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={destination.valuePerPackage}
                          onChange={(e) => updateDestination(destination.id, "valuePerPackage", Number(e.target.value))}
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Receita deste destino:</strong> R${" "}
                      {(destination.packages * destination.valuePerPackage).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={() => calculateRoute()} // Chamada sem argumentos para o modo manual
                  disabled={isCalculating || !formData.origin || destinations.some((dest) => !dest.city)}
                  className="w-full bg-[#fa3a2f] hover:bg-[#e8342a]"
                >
                  {isCalculating ? "Calculando Distâncias..." : "Calcular Rota Completa"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="excel" className="space-y-6">
            <ExcelImport onRoutesImported={handleRoutesImported} />

            {/* Rotas importadas */}
            {importedRoutes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Rotas Importadas ({importedRoutes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {importedRoutes.map((route, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{route.driver}</h4>
                          <p className="text-sm text-gray-600">
                            {route.origin} → {route.destinations[0].city}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => selectImportedRoute(index)} size="sm" variant="outline">
                            Editar
                          </Button>
                          <Button
                            onClick={() => calculateImportedRoute(route)} // Chamada com a rota específica
                            size="sm"
                            className="bg-[#fa3a2f] hover:bg-[#e8342a]"
                            disabled={isCalculating} // Desabilita enquanto calcula
                          >
                            Calcular
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Pacotes:</span> {route.destinations[0].packages}
                        </div>
                        <div>
                          <span className="text-gray-500">Valor/Pacote:</span> R${" "}
                          {route.destinations[0].valuePerPackage.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500">Outros Custos:</span> R$ {route.routeCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resultados */}
      {result && (
        <div className="space-y-6">
          <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Resumo e Análise Geral</TabsTrigger>
              <TabsTrigger value="financial">Análise Financeira e Métricas</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Resumo da Rota */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-[#fa3a2f]" />
                    Resumo da Rota
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Origem:</span> {result.origin}
                    </div>
                    {result.destinations.map((dest, index) => (
                      <div key={dest.id} className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#fa3a2f]" />
                        <span className="font-medium">Destino {index + 1}:</span> {dest.city}
                        <Badge variant="outline">
                          {dest.packages} pacotes × R$ {dest.valuePerPackage.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detalhamento das Distâncias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#fa3a2f]" />
                    Detalhamento das Distâncias e Tempos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.distanceBreakdown.map((segment, index) => {
                      const segmentTime = segment.distance / 60 // 60 km/h
                      return (
                        <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {segment.from} → {segment.to}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-blue-50">
                              {segment.distance} km
                            </Badge>
                            <Badge variant="outline" className="bg-green-50">
                              {formatTime(segmentTime)}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between items-center pt-3 font-semibold border-t">
                      <span>Totais da Rota:</span>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-[#fa3a2f]">{result.totalDistance} km</Badge>
                        <Badge className="bg-green-600">{formatTime(result.totalTravelTime)}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <p>
                        <strong>Velocidade média considerada:</strong> 60 km/h
                      </p>
                      <p>
                        <strong>Tempo total estimado:</strong> {formatTime(result.totalTravelTime)} de viagem
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Análise de Combustível Comparativa */}
              {result.fuelAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Fuel className="h-5 w-5 text-[#fa3a2f]" />
                      Análise Comparativa de Combustível - {result.fuelAnalysis.region}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Recomendação Principal */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800">💡 Recomendação</h4>
                        <Badge
                          className={`${result.fuelAnalysis.recommendation === "diesel" ? "bg-green-600" : "bg-blue-600"}`}
                        >
                          {result.fuelAnalysis.recommendation === "diesel" ? "🛢️ Diesel" : "⛽ Gasolina"}
                        </Badge>
                      </div>
                      <p className="text-sm text-green-700">
                        Use <strong>{result.fuelAnalysis.recommendation === "diesel" ? "Diesel" : "Gasolina"}</strong> e
                        economize <strong>R$ {result.fuelAnalysis.savings.toFixed(2)}</strong> nesta rota
                      </p>
                    </div>

                    {/* Comparação Lado a Lado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Diesel */}
                      <div
                        className={`p-4 rounded-lg border-2 ${result.fuelAnalysis.recommendation === "diesel" ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-gray-800 rounded-full">
                            <Fuel className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-800">🛢️ Diesel</h4>
                          {result.fuelAnalysis.recommendation === "diesel" && (
                            <Badge className="bg-green-600 text-white">Recomendado</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Preço/Litro</p>
                            <p className="font-bold text-gray-800">
                              R$ {result.fuelAnalysis.diesel.fuelPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Consumo</p>
                            <p className="font-bold text-blue-600">
                              {result.fuelAnalysis.diesel.consumption.toFixed(1)} L
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Custo Total</p>
                            <p className="font-bold text-red-600">
                              R$ {result.fuelAnalysis.diesel.fuelCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Custo/KM</p>
                            <p className="font-bold text-green-600">
                              R$ {result.fuelAnalysis.diesel.costPerKm.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
                          <p>
                            <strong>Eficiência:</strong> 8 km/L
                          </p>
                          <p>
                            <strong>Ideal para:</strong> Longas distâncias
                          </p>
                        </div>
                      </div>

                      {/* Gasolina */}
                      <div
                        className={`p-4 rounded-lg border-2 ${result.fuelAnalysis.recommendation === "gasoline" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-blue-600 rounded-full">
                            <Fuel className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-blue-800">⛽ Gasolina</h4>
                          {result.fuelAnalysis.recommendation === "gasoline" && (
                            <Badge className="bg-blue-600 text-white">Recomendado</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Preço/Litro</p>
                            <p className="font-bold text-gray-800">
                              R$ {result.fuelAnalysis.gasoline.fuelPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Consumo</p>
                            <p className="font-bold text-blue-600">
                              {result.fuelAnalysis.gasoline.consumption.toFixed(1)} L
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Custo Total</p>
                            <p className="font-bold text-red-600">
                              R$ {result.fuelAnalysis.gasoline.fuelCost.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-500">Custo/KM</p>
                            <p className="font-bold text-green-600">
                              R$ {result.fuelAnalysis.gasoline.costPerKm.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
                          <p>
                            <strong>Eficiência:</strong> 6 km/L
                          </p>
                          <p>
                            <strong>Ideal para:</strong> Curtas distâncias
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resumo Comparativo */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3 text-gray-800">📊 Resumo Comparativo</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Diferença de Preço</p>
                          <p className="font-bold text-orange-600">
                            R${" "}
                            {Math.abs(
                              result.fuelAnalysis.diesel.fuelPrice - result.fuelAnalysis.gasoline.fuelPrice,
                            ).toFixed(2)}
                            /L
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Economia Total</p>
                          <p className="font-bold text-green-600">R$ {result.fuelAnalysis.savings.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">% de Economia</p>
                          <p className="font-bold text-blue-600">
                            {(
                              (result.fuelAnalysis.savings /
                                Math.max(result.fuelAnalysis.diesel.fuelCost, result.fuelAnalysis.gasoline.fuelCost)) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dicas Adicionais */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium text-yellow-800 mb-2">💡 Dicas de Economia:</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                          • <strong>Diesel:</strong> Mais econômico para rotas longas (&gt;200km)
                        </li>
                        <li>
                          • <strong>Gasolina:</strong> Pode ser vantajosa em rotas curtas com preço baixo
                        </li>
                        <li>
                          • <strong>Manutenção:</strong> Motores diesel têm maior durabilidade
                        </li>
                        <li>
                          • <strong>Disponibilidade:</strong> Verifique postos na rota escolhida
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              {/* Análise Financeira Completa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#fa3a2f]" />
                    Análise Financeira Completa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Receita */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Receita Total</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {result.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{result.totalPackages} pacotes</p>
                  </div>

                  {/* Breakdown de Custos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-500">Custos Operacionais</p>
                      <p className="text-xl font-bold text-orange-600">R$ {result.routeCost.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Pedágios, alimentação, hospedagem</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-500">Lucro Líquido</p>
                      <p className="text-xl font-bold text-green-600">R$ {result.profit.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Receita - Custos Operacionais</p>
                    </div>
                  </div>

                  {/* Informação sobre Combustível (Separada) */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Informação de Combustível</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Custo Estimado de Combustível:</p>
                        <p className="font-bold text-yellow-700">R$ {result.fuelCost.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          ({result.fuelAnalysis?.recommendation === "diesel" ? "Diesel" : "Gasolina"} recomendado)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impacto na Margem:</p>
                        <p className="font-bold text-yellow-700">
                          {result.totalRevenue > 0
                            ? (
                                ((result.totalRevenue - result.routeCost - result.fuelCost) / result.totalRevenue) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                        <p className="text-xs text-gray-500">Se combustível fosse incluído</p>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      💡 <strong>Nota:</strong> O combustível não está incluído no cálculo de lucro. Use esta informação
                      para negociação de preços.
                    </p>
                  </div>

                  <div className="text-center">
                    {(() => {
                      const { status, color, icon: Icon } = getProfitabilityStatus(result.profitMargin)
                      return (
                        <Badge className={`${color} text-white px-4 py-2 text-lg`}>
                          <Icon className="h-4 w-4 mr-2" />
                          Margem: {result.profitMargin.toFixed(1)}% - {status}
                        </Badge>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#fa3a2f]" />
                    Métricas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Receita por KM</p>
                      <p className="font-semibold">R$ {(result.totalRevenue / result.totalDistance).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Custo Operacional por KM</p>
                      <p className="font-semibold">R$ {(result.routeCost / result.totalDistance).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lucro por Hora</p>
                      <p className="font-semibold">R$ {(result.profit / result.totalTravelTime).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Receita por Hora</p>
                      <p className="font-semibold">R$ {(result.totalRevenue / result.totalTravelTime).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pacotes por Hora</p>
                      <p className="font-semibold">{(result.totalPackages / result.totalTravelTime).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Eficiência Operacional</p>
                      <p className="font-semibold">{(result.totalRevenue / result.routeCost).toFixed(2)}x</p>
                    </div>
                  </div>

                  {/* Seção adicional com informações de combustível */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-3">📊 Métricas com Combustível (Informativo)</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-gray-500">Custo Total c/ Combustível</p>
                        <p className="font-semibold">R$ {(result.routeCost + result.fuelCost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lucro c/ Combustível</p>
                        <p className="font-semibold">
                          R$ {(result.totalRevenue - result.routeCost - result.fuelCost).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Margem c/ Combustível</p>
                        <p className="font-semibold">
                          {result.totalRevenue > 0
                            ? (
                                ((result.totalRevenue - result.routeCost - result.fuelCost) / result.totalRevenue) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Custo Total por KM</p>
                        <p className="font-semibold">
                          R$ {((result.routeCost + result.fuelCost) / result.totalDistance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exportar Relatório */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Exportar Relatório</span>
                    <PDFExport
                      data={{
                        title: `Relatório de Rota - ${result.driver}`,
                        data: result,
                        type: "route",
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Gere um relatório completo em PDF com todos os dados da rota, análises financeiras e métricas de
                    combustível.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      {/* Success Dialog for Route Calculation */}
      <AlertDialog open={showCalculationSuccessDialog} onOpenChange={setShowCalculationSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Rota Calculada com Sucesso!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            A rota para {result?.driver} foi calculada e adicionada ao histórico.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCalculationSuccessDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
