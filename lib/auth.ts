export interface AdminInfo {
    _id: string
    email: string
    role: string
  }
  
  export interface AuthTokens {
    accessToken: string
    refreshToken: string
  }
  
  export const getStoredTokens = (): AuthTokens | null => {
    if (typeof window === "undefined") return null
  
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")
  
    if (!accessToken || !refreshToken) return null
  
    return { accessToken, refreshToken }
  }
  
  export const getStoredAdminInfo = (): AdminInfo | null => {
    if (typeof window === "undefined") return null
  
    const adminInfo = localStorage.getItem("adminInfo")
    if (!adminInfo) return null
  
    try {
      return JSON.parse(adminInfo)
    } catch {
      return null
    }
  }
  
  export const clearAuthData = () => {
    if (typeof window === "undefined") return
  
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("adminInfo")
  }
  
  export const isAuthenticated = (): boolean => {
    return getStoredTokens() !== null
  }
  
  export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const tokens = getStoredTokens()
    if (!tokens) {
      throw new Error("No authentication tokens found")
    }
  
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
      ...options.headers,
    }
  
    const response = await fetch(url, {
      ...options,
      headers,
    })
  
    // Handle token refresh if needed
    if (response.status === 401) {
      // Token might be expired, redirect to login
      clearAuthData()
      window.location.href = "/login"
      throw new Error("Authentication expired")
    }
  
    return response
  }
  