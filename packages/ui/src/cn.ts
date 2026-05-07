import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — tailwind-merge wrapped clsx. Use everywhere for conditional class
 * composition; resolves Tailwind utility conflicts in last-wins order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
