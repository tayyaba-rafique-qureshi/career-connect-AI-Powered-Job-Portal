import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, registerUser } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const _persist = (token, userData) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const login = async (email, password) => {
    const data = await loginUser(email, password)
    _persist(data.token, data.user)
    return data
  }

  const register = async (payload) => {
    const data = await registerUser(payload)
    _persist(data.token, data.user)
    return data
  }

  // Called by AuthCallback after Google OAuth redirect
  const setUserFromOAuth = (token, userData) => {
    _persist(token, userData)
  }

  // Called after onboarding completes — mark profile as complete
  // Pass updatedRole if the role changed during onboarding (e.g. employer)
  const markProfileComplete = (updatedRole) => {
    const updated = { ...user, onboardingComplete: true, isProfileComplete: true }
    if (updatedRole) updated.role = updatedRole
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, setUserFromOAuth, markProfileComplete }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
