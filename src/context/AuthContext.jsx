import { createContext, useContext, useState, useEffect } from "react"
import { auth, onAuthStateChanged, login, register, logout, resetPassword } from "../services/firebase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const value = {
    user,
    loading,
    login: (email, password) => login(email, password),
    register: (email, password) => register(email, password),
    logout: () => logout(),
    resetPassword: (email) => resetPassword(email),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
