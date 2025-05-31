import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const getStoredTokens = () => {
  if (typeof window === "undefined") return null

  const accessToken = localStorage.getItem("accessToken")
  const refreshToken = localStorage.getItem("refreshToken")

  if (!accessToken || !refreshToken) return null

  return { accessToken, refreshToken }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
