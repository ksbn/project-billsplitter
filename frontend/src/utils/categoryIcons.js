import { UtensilsCrossed, Bed, Car, Receipt } from 'lucide-react'

export const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  stay: Bed,
  transport: Car,
}

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || Receipt
}