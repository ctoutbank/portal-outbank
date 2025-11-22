"use client"

import React from "react"
import {
  MastercardLogo,
  VisaLogo,
  AmexLogo,
  DiscoverLogo,
  DinersLogo,
  JcbLogo,
  UnionpayLogo,
  EloLogo,
  HipercardLogo,
} from "react-payment-logos"

interface CardLogoProps {
  cardName: string
  width?: number
  height?: number
  className?: string
}

// Mapeamento dos nomes de cartões para os componentes da biblioteca
const cardLogoMap: Record<string, React.ComponentType<{ width?: number; height?: number; className?: string }>> = {
  MASTERCARD: MastercardLogo,
  VISA: VisaLogo,
  AMERICAN_EXPRESS: AmexLogo,
  AMEX: AmexLogo,
  ELO: EloLogo,
  HIPERCARD: HipercardLogo,
  CABAL: HipercardLogo, // CABAL não existe na biblioteca, usando Hipercard como fallback
  DISCOVER: DiscoverLogo,
  DINERS: DinersLogo,
  JCB: JcbLogo,
  UNIONPAY: UnionpayLogo,
  // Também suporta variações com espaços ou minúsculas
  Mastercard: MastercardLogo,
  Visa: VisaLogo,
  "American Express": AmexLogo,
  Amex: AmexLogo,
  Elo: EloLogo,
  Hipercard: HipercardLogo,
  Cabal: HipercardLogo,
}

export function CardLogo({ cardName, width = 40, height = 24, className = "" }: CardLogoProps) {
  // Normalizar o nome do cartão
  const normalizedCardName = cardName?.toUpperCase().trim() || ""
  
  // Encontrar o componente correspondente
  const LogoComponent = cardLogoMap[normalizedCardName]
  
  if (!LogoComponent) {
    // Se não encontrar, tentar variações com espaços
    const spacedVariation = cardName?.trim() || ""
    const SpacedComponent = cardLogoMap[spacedVariation]
    
    if (SpacedComponent) {
      return <SpacedComponent width={width} height={height} className={className} />
    }
    
    // Retornar null se não encontrar nenhum logo
    return null
  }
  
  return <LogoComponent width={width} height={height} className={className || "object-contain"} />
}

