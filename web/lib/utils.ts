import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyK(value: number): string {
  return `$${value.toFixed(1)}k`;
}

export function formatSalesUnits(value: number): string {
  return `${value.toFixed(2)}k units`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
