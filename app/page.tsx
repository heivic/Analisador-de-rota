"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, Clock, Truck, BarChart3, PieChart } from "lucide-react"
import RouteCalculator from "@/components/route-calculator"
import ProfitabilityDashboard from "@/components/main"
import RouteHistory from "@/components/route-history"
import RouteComparison from "@/components/route-comparison"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("calculator")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-[#fa3a2f] rounded-full">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Analisador de Rentabilidade</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calcule distâncias, custos e analise a rentabilidade das suas rotas de entrega
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Comparação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <RouteCalculator />
          </TabsContent>

          <TabsContent value="dashboard">
            <ProfitabilityDashboard />
          </TabsContent>

          <TabsContent value="history">
            <RouteHistory />
          </TabsContent>

          <TabsContent value="comparison">
            <RouteComparison />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
