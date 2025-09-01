import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import { User, AuthState, LoginCredentials, SignupCredentials } from '../types/auth'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false) // Start with false - show login immediately
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const checkExistingSession = async () => {
      try {
        console.log('Checking existing session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Existing session:', session?.user?.id)
        
        if (session?.user) {
          console.log('User already logged in, fetching profile...')
          setLoading(true) // Show loading while fetching profile
          await fetchUserProfile(session.user.id)
        } else {
          console.log('No existing session - show login form')
          setLoading(false) // No loading, show login form
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Failed to check session')
        setLoading(false) // Show login form on error
      }
    }

    checkExistingSession()

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, fetching profile...')
          setLoading(true) // Show loading while fetching profile
          await fetchUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
          setLoading(false) // Show login form
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('fetchUserProfile called with userId:', userId)
    
    try {
      // Get user from database
      console.log('Fetching user from database...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('Database query result:', { data, error })

      if (error || !data) {
        console.error('Error fetching user profile or no data:', error)
        // Create fallback user from auth
        const { data: authUser } = await supabase.auth.getUser()
        if (authUser.user) {
          const fallbackUser = {
            id: authUser.user.id,
            email: authUser.user.email || '',
            role: 'admin', // Default role
            name: authUser.user.email?.split('@')[0] || 'Admin User',
            department: 'IT',
            phone: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('Setting fallback user:', fallbackUser)
          setUser(fallbackUser)
        }
      } else {
        // Use database data
        const userData = {
          id: data.id,
          email: data.email || '',
          role: data.role || 'admin',
          name: data.name || data.email?.split('@')[0] || 'Admin User',
          department: data.department || 'IT',
          phone: data.phone || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        }
        console.log('Setting user from database:', userData)
        setUser(userData)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      // Create fallback user from auth
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        const fallbackUser = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          role: 'admin',
          name: authUser.user.email?.split('@')[0] || 'Admin User',
          department: 'IT',
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('Setting fallback user after error:', fallbackUser)
        setUser(fallbackUser)
      }
    }
    
    console.log('fetchUserProfile completed')
    setLoading(false) // Always set loading to false when done
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('Login started with email:', credentials.email)
      setLoading(true) // Show loading spinner
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      console.log('Login response:', { data: data?.user?.id, error })

      if (error) {
        console.error('Login error:', error)
        setLoading(false) // Hide loading on error
        throw error
      }

      if (data.user) {
        console.log('Login successful, fetching user profile...')
        // fetchUserProfile will set loading to false when done
        await fetchUserProfile(data.user.id)
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      setError(err.message || 'Login failed')
      setLoading(false) // Hide loading on error
      throw err
    }
  }

  const signup = async (credentials: SignupCredentials) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: credentials.email,
            role: credentials.role || 'user',
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      // User will be set to null by onAuthStateChange
      console.log('Logout successful')
    } catch (err: any) {
      setError(err.message || 'Logout failed')
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        throw error
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
