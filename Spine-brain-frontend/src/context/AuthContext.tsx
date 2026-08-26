import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/crm';
import { apiClient } from '../api/client';
import { queryClient } from '../queryClient';

interface LoginResult {
  mfaRequired?: boolean;
  mfaChallenge?: string;
  user?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<LoginResult>;
  verifyMfa: (mfaChallenge: string, code: string) => Promise<void>;
  verifyMfaRecovery: (mfaChallenge: string, recoveryCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('token');
    if (token) {
      apiClient<{ success: boolean; data: any }>('/auth/me')
        .then((res) => {
          if (res.success) {
            setUser({
              name: `${res.data.firstName} ${res.data.lastName}`,
              email: res.data.email,
              role: res.data.roleName || res.data.role,
              avatar: `${res.data.firstName[0]}${res.data.lastName[0]}`.toUpperCase(),
              clinic: 'Main Campus (Roseville)'
            });
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<LoginResult> => {
    try {
      const res = await apiClient<{ success: boolean; mfaRequired?: boolean; data: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      
      if (res.mfaRequired || res.data?.mfaRequired) {
        return {
          mfaRequired: true,
          mfaChallenge: res.data?.mfaChallenge,
          user: res.data?.user
        };
      }

      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        setUser({
          name: `${res.data.user.firstName} ${res.data.user.lastName}`,
          email: res.data.user.email,
          role: res.data.user.role,
          avatar: `${res.data.user.firstName[0]}${res.data.user.lastName[0]}`.toUpperCase(),
          clinic: 'Main Campus (Roseville)'
        });
        setIsAuthenticated(true);
        return { mfaRequired: false };
      }

      return { mfaRequired: false };
    } catch (error: any) {
      console.error('Login failed:', error?.message || 'Authentication error');
      throw error;
    }
  };

  const verifyMfa = async (mfaChallenge: string, code: string) => {
    try {
      const res = await apiClient<{ success: boolean; data: { token: string; user: any } }>('/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ mfaChallenge, code })
      });

      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        setUser({
          name: `${res.data.user.firstName} ${res.data.user.lastName}`,
          email: res.data.user.email,
          role: res.data.user.role,
          avatar: `${res.data.user.firstName[0]}${res.data.user.lastName[0]}`.toUpperCase(),
          clinic: 'Main Campus (Roseville)'
        });
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('MFA verification failed:', error?.message || 'MFA error');
      throw error;
    }
  };

  const verifyMfaRecovery = async (mfaChallenge: string, recoveryCode: string) => {
    try {
      const res = await apiClient<{ success: boolean; data: { token: string; user: any } }>('/auth/mfa/verify-recovery', {
        method: 'POST',
        body: JSON.stringify({ mfaChallenge, recoveryCode })
      });

      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        setUser({
          name: `${res.data.user.firstName} ${res.data.user.lastName}`,
          email: res.data.user.email,
          role: res.data.user.role,
          avatar: `${res.data.user.firstName[0]}${res.data.user.lastName[0]}`.toUpperCase(),
          clinic: 'Main Campus (Roseville)'
        });
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Recovery code verification failed:', error?.message || 'MFA error');
      throw error;
    }
  };

  const logout = () => {
    // Revoke server-side session in database asynchronously
    apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
    
    // Clear all client-side auth tokens and in-memory query cache
    localStorage.removeItem('token');
    queryClient.clear();
    
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, verifyMfa, verifyMfaRecovery, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
