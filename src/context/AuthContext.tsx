import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  role: 'Administrator' | 'Marketer' | 'Dizajner' | 'Menaxher' | 'Agjent shitjeje' | 'Agjent mbështetje' | 'Serviser';
  name: string;
  department: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is stored in localStorage
    const checkStoredUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Found stored user:', userData);
          setUser(userData);
        } catch (err) {
          console.error('Error parsing stored user:', err);
          localStorage.removeItem('user');
        }
      }
    };

    checkStoredUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Logging in with username:', credentials.username);
      
      // Use the password verification function
      const { data, error } = await supabase
        .rpc('verify_user_password', {
          username: credentials.username,
          user_password: credentials.password
        });

      console.log('Password verification result:', { data, error });

      if (error || !data || data.length === 0) {
        throw new Error('Invalid username or password');
      }

      const userData = data[0];
      console.log('Login successful, user found:', userData);
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      // Remove user from localStorage
      localStorage.removeItem('user');
      setUser(null);
      console.log('Logout successful');
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};