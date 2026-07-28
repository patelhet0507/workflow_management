"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { api, verifyPassword, type UserData } from "./api"

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role: string) => Promise<void>
  logout: () => Promise<void>
  verifyPassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

function useUserDoc(uid: string) {
  return getDoc(doc(db, "users", uid)).then((s) => (s.exists() ? ({ id: s.id, ...s.data() } as UserData) : null))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const u = await useUserDoc(fbUser.uid)
          setUser(u)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    setUser(result.user)
  }

  const register = async (email: string, password: string, name: string, role: string) => {
    const result = await api.register(email, password, name, role)
    setUser(result.user)
  }

  const logout = async () => {
    await firebaseSignOut(auth)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout, verifyPassword }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
