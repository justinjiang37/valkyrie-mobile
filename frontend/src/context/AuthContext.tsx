import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import {
  User,
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
  updateProfile as updateProfileApi,
} from "../services/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; newPassword?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const user = await getCurrentUser();
      if (!mounted) return;
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await getCurrentUser();
      setState({ user, isAuthenticated: !!user, isLoading: false });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await loginApi(email, password);
      setState({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await registerApi(email, password, name);
      setState({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await logoutApi();
    } finally {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; newPassword?: string }) => {
    const updatedUser = await updateProfileApi(data);
    setState((prev) => ({ ...prev, user: updatedUser }));
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await getCurrentUser();
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
