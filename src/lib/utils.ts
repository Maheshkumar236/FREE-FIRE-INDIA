import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAppUID(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function generateSquadCode(): string {
  return "SQ" + Math.floor(10000 + Math.random() * 90000).toString();
}
