"use client"

import React from "react"
import {
  Mastercard,
  Visa,
  Amex,
  Discover,
  Diners,
  Jcb,
  Unionpay,
  Elo,
  Hipercard,
} from "react-payment-logos/dist/flat"

interface CardLogoProps {
  cardName: string
  width?: number
  height?: number
  className?: string
}

// Mapeamento dos nomes de cartões para os componentes da biblioteca
const cardLogoMap: Record<string, React.ComponentType<{ width?: number; height?: number; className?: string }>> = {
  MASTERCARD: Mastercard,
  VISA: Visa,
  AMERICAN_EXPRESS: Amex,
  AMEX: Amex,
  ELO: Elo,
  HIPERCARD: Hipercard,
  CABAL: Hipercard, // CABAL não existe na biblioteca, usando Hipercard como fallback
  DISCOVER: Discover,
  DINERS: Diners,
  JCB: Jcb,
  UNIONPAY: Unionpay,
  // Também suporta variações com espaços ou minúsculas
  Mastercard: Mastercard,
  Visa: Visa,
  "American Express": Amex,
  Amex: Amex,
  Elo: Elo,
  Hipercard: Hipercard,
  Cabal: Hipercard,
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

