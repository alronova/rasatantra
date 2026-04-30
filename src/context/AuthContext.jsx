import { useEffect, useState } from 'react'
import { apiRequest, TOKEN_STORAGE_KEY } from '../lib/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  )

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!token) {
      return
    }

    apiRequest('/auth/me')
      .then((data) => {
        setUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const register = async (payload) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setUser(data.user)
    return data
  }

  const login = async (payload) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
