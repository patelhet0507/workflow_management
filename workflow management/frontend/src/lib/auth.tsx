"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api } from "./api"

export interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem("token")
    const u = localStorage.getItem("user")
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
      api.setToken(t)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    api.setToken(res.token)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem("user", JSON.stringify(res.user))
  }

  const logout = () => {
    api.setToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
