"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ExportData {
  title: string
  data: any
  type: "dashboard" | "history" | "comparison" | "route"
}

interface PDFExportProps {
  data: ExportData
  className?: string
}

export default function PDFExport({ data, className = "" }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    setIsExporting(true)

    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Cabeçalho
      pdf.setFontSize(20)
      pdf.setTextColor(250, 58, 47) // #fa3a2f
      pdf.text("Analisador de Rentabilidade - Relatório", pageWidth / 2, 20, { align: "center" })

      pdf.setFontSize(16)
      pdf.setTextColor(0, 0, 0)
      pdf.text(data.title || "Relatório", pageWidth / 2, 30, { align: "center" })

      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, 40, { align: "center" })

      if (data.type === "route") {
        // Para o tipo de rota, sempre use a adição programática de dados
        await addRouteData(pdf, data.data, 60, pageWidth, pageHeight) // Inicia Y após o cabeçalho
      } else {
        // Para outros tipos, mantém a lógica de html2canvas (ou estende a programática se necessário)
        const appElement = document.querySelector("main") || document.body
        if (appElement) {
          const canvas = await html2canvas(appElement as HTMLElement, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: appElement.scrollWidth,
            height: appElement.scrollHeight,
            scrollX: 0,
            scrollY: 0,
          })

          const imgData = canvas.toDataURL("image/png")
          const imgWidth = pageWidth - 20
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          let yPosition = 50
          if (imgHeight > pageHeight - 60) {
            const maxHeightPerPage = pageHeight - 70
            const totalPages = Math.ceil(imgHeight / maxHeightPerPage)

            for (let page = 0; page < totalPages; page++) {
              if (page > 0) {
                pdf.addPage()
                yPosition = 10
              }
              const sourceY = (page * maxHeightPerPage * canvas.height) / imgHeight
              const sourceHeight = Math.min((maxHeightPerPage * canvas.height) / imgHeight, canvas.height - sourceY)
              const tempCanvas = document.createElement("canvas")
              const tempCtx = tempCanvas.getContext("2d")
              tempCanvas.width = canvas.width
              tempCanvas.height = sourceHeight
              if (tempCtx) {
                tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
                const tempImgData = tempCanvas.toDataURL("image/png")
                const tempImgHeight = (sourceHeight * imgWidth) / canvas.width
                pdf.addImage(tempImgData, "PNG", 10, yPosition, imgWidth, tempImgHeight)
              }
            }
          } else {
            pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight)
          }
        }
      }

      // Salvar PDF
      const fileName = `relatorio-${data.type}-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    }

    setIsExporting(false)
  }

  return (
    <Button onClick={exportToPDF} disabled={isExporting} className={`bg-[#fa3a2f] hover:bg-[#e8342a] ${className}`}>
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar PDF
        </>
      )}
    </Button>
  )
}

// Função auxiliar para formatar tempo (duplicada para uso interno do PDF)
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

// Função para adicionar dados de rota individual (aprimorada para múltiplas seções e páginas)
async function addRouteData(
  pdf: jsPDF,
  data: any,
  startY: number,
  pageWidth: number,
  pageHeight: number,
): Promise<void> {
  let yPosition = startY
  const marginX = 20 // Margem esquerda e direita

  // Helper para adicionar título de seção e avançar yPosition, com lógica de quebra de página
  const addSectionTitle = (title: string, color: number[] = [250, 58, 47], fontSize = 14) => {
    if (yPosition + 20 > pageHeight - 20) {
      // Verifica se há espaço suficiente para o título + algum conteúdo
      pdf.addPage()
      yPosition = 20
    }
    pdf.setFontSize(fontSize)
    pdf.setTextColor(color[0], color[1], color[2])
    pdf.text(title, marginX, yPosition)
    yPosition += 10
    pdf.setTextColor(0, 0, 0) // Redefine a cor do texto
    pdf.setFontSize(10) // Redefine o tamanho da fonte para o conteúdo
  }

  // Helper para adicionar linha de informação e avançar yPosition
  const addInfoLine = (label: string, value: string | number, isBold = false) => {
    if (yPosition + 7 > pageHeight - 10) {
      // Verifica se há espaço suficiente para a linha
      pdf.addPage()
      yPosition = 20
    }
    pdf.setFont(undefined, isBold ? "bold" : "normal")
    pdf.text(`${label}: ${value}`, marginX, yPosition)
    yPosition += 6
  }

  // --- Primeira Aba: Resumo da Rota, Detalhamento das Distâncias e Tempos, Análise Comparativa de Combustível ---

  // 1. Resumo da Rota
  addSectionTitle("Resumo da Rota")
  addInfoLine("Motorista", data?.driver || "N/A", true)
  addInfoLine("Origem", data?.origin || "N/A")
  addInfoLine("Destinos", data?.destinations?.map((d: any) => d?.city || "N/A").join(" → ") || "N/A")
  addInfoLine("Distância Total", `${data?.totalDistance || 0} km`)
  addInfoLine("Tempo Estimado", `${(data?.totalTravelTime || 0).toFixed(1)} horas`)
  addInfoLine("Total de Pacotes", `${data?.totalPackages || 0}`)
  yPosition += 10 // Adiciona algum espaço

  // 2. Detalhamento das Distâncias e Tempos
  addSectionTitle("Detalhamento das Distâncias e Tempos")
  if (data?.distanceBreakdown && Array.isArray(data.distanceBreakdown) && data.distanceBreakdown.length > 0) {
    data.distanceBreakdown.forEach((segment: any) => {
      const segmentTime = (segment.distance || 0) / 60 // 60 km/h
      addInfoLine(
        `${segment.from || "N/A"} → ${segment.to || "N/A"}`,
        `${segment.distance || 0} km (${formatTime(segmentTime)})`,
      )
    })
  } else {
    addInfoLine("Nenhum detalhamento de distância disponível", "")
  }
  addInfoLine("Velocidade média considerada", "60 km/h")
  addInfoLine("Tempo total estimado de viagem", formatTime(data?.totalTravelTime || 0))
  yPosition += 10

  // 3. Análise Comparativa de Combustível
  if (data?.fuelAnalysis && typeof data.fuelAnalysis === "object") {
    addSectionTitle("Análise Comparativa de Combustível - " + (data.fuelAnalysis.region || "N/A"))
    addInfoLine("Recomendação", data.fuelAnalysis.recommendation === "diesel" ? "Diesel" : "Gasolina", true)
    addInfoLine("Economia Estimada", `R$ ${data.fuelAnalysis.savings.toFixed(2)}`, true)
    addInfoLine("Preço Diesel/Litro", `R$ ${data.fuelAnalysis.diesel.fuelPrice.toFixed(2)}`)
    addInfoLine("Custo Total Diesel", `R$ ${data.fuelAnalysis.diesel.fuelCost.toFixed(2)}`)
    addInfoLine("Preço Gasolina/Litro", `R$ ${data.fuelAnalysis.gasoline.fuelPrice.toFixed(2)}`)
    addInfoLine("Custo Total Gasolina", `R$ ${data.fuelAnalysis.gasoline.fuelCost.toFixed(2)}`)
    yPosition += 10
  }

  // --- Nova Página para a Segunda Aba ---
  pdf.addPage()
  yPosition = 20 // Redefine a posição Y para a nova página

  // 4. Análise Financeira Completa
  addSectionTitle("Análise Financeira Completa")
  addInfoLine("Receita Total", `R$ ${(data?.totalRevenue || 0).toFixed(2)}`, true)
  addInfoLine("Outros Custos", `R$ ${(data?.routeCost || 0).toFixed(2)}`)
  addInfoLine("Custo Combustível (Estimado)", `R$ ${(data?.fuelCost || 0).toFixed(2)}`)
  addInfoLine("Lucro Líquido (sem combustível)", `R$ ${(data?.profit || 0).toFixed(2)}`, true)
  addInfoLine("Margem de Lucro (sem combustível)", `${(data?.profitMargin || 0).toFixed(1)}%`, true)
  addInfoLine(
    "Lucro Líquido (com combustível)",
    `R$ ${(data?.totalRevenue - (data?.routeCost || 0) - (data?.fuelCost || 0)).toFixed(2)}`,
  )
  addInfoLine(
    "Margem de Lucro (com combustível)",
    `${
      data?.totalRevenue > 0
        ? (((data?.totalRevenue - (data?.routeCost || 0) - (data?.fuelCost || 0)) / data?.totalRevenue) * 100).toFixed(
            1,
          )
        : 0
    }%`,
  )
  yPosition += 10

  // 5. Métricas de Performance
  addSectionTitle("Métricas de Performance")
  addInfoLine(
    "Receita por KM",
    `R$ ${data?.totalDistance ? (data.totalRevenue / data.totalDistance).toFixed(2) : "0.00"}`,
  )
  addInfoLine(
    "Custo Operacional por KM",
    `R$ ${data?.totalDistance ? (data.routeCost / data.totalDistance).toFixed(2) : "0.00"}`,
  )
  addInfoLine(
    "Lucro por Hora",
    `R$ ${data?.totalTravelTime ? (data.profit / data.totalTravelTime).toFixed(2) : "0.00"}`,
  )
  addInfoLine(
    "Receita por Hora",
    `R$ ${data?.totalTravelTime ? (data.totalRevenue / data.totalTravelTime).toFixed(2) : "0.00"}`,
  )
  addInfoLine(
    "Pacotes por Hora",
    `${data?.totalTravelTime ? (data.totalPackages / data.totalTravelTime).toFixed(1) : "0.0"}`,
  )
  addInfoLine(
    "Eficiência Operacional",
    `${data?.routeCost ? (data.totalRevenue / data.routeCost).toFixed(2) : "0.00"}x`,
  )
  yPosition += 10
}
