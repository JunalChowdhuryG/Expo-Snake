import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de forma segura.
 * (ShadCN UI lo usa en todos sus componentes).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
