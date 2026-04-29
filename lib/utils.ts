import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | null | undefined, fallback = "·") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || fallback;
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function formatPoints(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value} pt${Math.abs(value) === 1 ? "" : "s"}`;
}

const SPAIN_TZ = "Europe/Madrid";

export function formatDateTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("es-ES", { timeZone: SPAIN_TZ, ...options });
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("es-ES", { timeZone: SPAIN_TZ, ...options });
}

export function formatTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("es-ES", { timeZone: SPAIN_TZ, ...options });
}
