"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import authService from "@/services/auth";

// Definir el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Sincronizar token entre localStorage y cookies
        await authService.syncToken();
        
        // Verificar si hay un token válido
        const hasToken = authService.isAuthenticated();
        setIsAuthenticated(hasToken);

        // Redireccionar según el estado de autenticación
        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
        
        if (!hasToken && !isPublicRoute) {
          router.push("/login");
        } else if (hasToken && isPublicRoute) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        setIsAuthenticated(false);
      } finally {
        // Terminar el estado de carga
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Función para iniciar sesión
  const login = (token: string) => {
    authService.setToken(token);
    setIsAuthenticated(true);
    router.push("/dashboard");
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.clearToken();
    setIsAuthenticated(false);
    router.push("/login");
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
