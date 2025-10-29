export function getCardImage(brandName: string): string {
  const brandMap: Record<string, string> = {
    'Visa': '/images/cards/visa.png',
    'Mastercard': '/images/cards/mastercard.png',
    'Elo': '/images/cards/elo.png',
    'Amex': '/images/cards/amex.png',
    'Hipercard': '/images/cards/hipercard.png',
  };

  return brandMap[brandName] || '';
}