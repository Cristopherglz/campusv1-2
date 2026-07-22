// Contexto de Autenticación para el Campus Duomo LMS
// Maneja el estado de autenticación, roles y permisos - Conexión Real a Moodle

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole, AuthResponse } from '@/types';
import { moodleApi, type MoodleErrorCode } from '@/services/moodleApi';
import { demoAuth } from '@/services/demoAuth';
import { toast } from 'sonner';

// Modo de autenticación: 'demo' o 'moodle'
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'demo';

// ============================================
// TIPOS
// ============================================

interface AuthContextType {
  user: User | null;
  token: string | null;           // ← NUEVO: token expuesto para useMoodleImageUrl
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  errorCode: MoodleErrorCode | null;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  canAccess: (allowedRoles: UserRole[]) => boolean;
  clearError: () => void;
  authMode: string;
  retryAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(              // ← NUEVO
    () => localStorage.getItem('moodle_token')                    // inicializar desde localStorage
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<MoodleErrorCode | null>(null);

  // Verificar sesión al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  // ============================================
  // VERIFICACIÓN DE AUTENTICACIÓN
  // ============================================

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);
      
      if (AUTH_MODE === 'demo') {
        const savedUser = localStorage.getItem('demo_user');
        const savedToken = localStorage.getItem('demo_token');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setToken(savedToken);                                  // ← NUEVO
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Error al parsear usuario demo:', e);
            localStorage.removeItem('demo_user');
          }
        }
        setIsLoading(false);
        return;
      }
      
      // Modo Moodle real
      const storedToken = localStorage.getItem('moodle_token');
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);                                       // ← NUEVO: sincronizar token al inicio

      // Verificar token válido obteniendo información del usuario
      const userProfile = await moodleApi.getUserProfile();
      
      setUser(userProfile);
      console.log('USER profileimageurl:', userProfile.profileimageurl);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Error al verificar autenticación:', err);
      
      if (err.errorcode === 'invalidtoken') {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        setErrorCode('invalidtoken');
      } else if (err.errorcode === 'network_error') {
        setError('Error de conexión. Verifica tu conexión a internet.');
        setErrorCode('network_error');
      } else if (err.errorcode === 'timeout') {
        setError('La solicitud tardó demasiado. Intenta nuevamente.');
        setErrorCode('timeout');
      } else {
        setError(err.message || 'Error al verificar autenticación');
        setErrorCode(err.errorcode || 'unknown');
      }
      
      setToken(null);                                              // ← NUEVO: limpiar token en error
      moodleApi.logout();
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // LOGIN
  // ============================================

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);

      let response: AuthResponse;

      if (AUTH_MODE === 'demo') {
        response = await demoAuth.login(username, password);
      } else {
        response = await moodleApi.login(username, password);
      }

      if (response.error) {
        setError(response.error);
        setErrorCode(response.errorcode as MoodleErrorCode);
        toast.error(response.error);
        return false;
      }

      if (!response.user) {
        setError('Error al obtener información del usuario');
        setErrorCode('unknown');
        toast.error('Error al obtener información del usuario');
        return false;
      }

      if (AUTH_MODE === 'demo') {
        localStorage.setItem('demo_user', JSON.stringify(response.user));
        localStorage.setItem('demo_token', response.token || '');
        setToken(response.token || null);                          // ← NUEVO
      } else {
        // En modo Moodle, el token ya fue guardado en localStorage por moodleApi.login()
        // Solo necesitamos sincronizarlo al estado de React
        const newToken = response.token || localStorage.getItem('moodle_token');
        setToken(newToken || null);                                // ← NUEVO
      }

      setUser(response.user);
      setIsAuthenticated(true);
      
      const roleLabel = response.user.roles?.includes('editingteacher') ? 'Profesor' : 'Estudiante';
      toast.success(`¡Bienvenido, ${response.user.firstname}! (${roleLabel})`);
      
      return true;
    } catch (err: any) {
      console.error('Error en login:', err);
      const errorMsg = err.message || 'Error al iniciar sesión';
      setError(errorMsg);
      setErrorCode(err.errorcode || 'unknown');
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // LOGOUT
  // ============================================

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (AUTH_MODE === 'demo') {
        await demoAuth.logout();
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_token');
      } else {
        await moodleApi.logout();
      }
      
      setUser(null);
      setToken(null);                                              // ← NUEVO: limpiar token al logout
      setIsAuthenticated(false);
      setError(null);
      setErrorCode(null);
      toast.info('Sesión cerrada correctamente');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // REINTENTAR AUTENTICACIÓN
  // ============================================

  const retryAuth = useCallback(async () => {
    await checkAuth();
  }, []);

  // ============================================
  // REFRESCAR USUARIO
  // ============================================

  const refreshUser = useCallback(async () => {
    try {
      const userProfile = await moodleApi.getUserProfile();
      setUser(userProfile);
      // Resincronizar token por las dudas
      const currentToken = localStorage.getItem('moodle_token');  // ← NUEVO
      if (currentToken) setToken(currentToken);                   // ← NUEVO
    } catch (err) {
      console.error('Error al refrescar usuario:', err);
    }
  }, []);

  // ============================================
  // ACTUALIZAR USUARIO
  // ============================================

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user) throw new Error('No hay usuario autenticado');
      
      await moodleApi.updateUser({
        id: user.id,
        ...userData
      });
      
      setUser(prev => prev ? { ...prev, ...userData } : null);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      throw err;
    }
  }, [user]);

  // ============================================
  // HELPERS DE ROLES
  // ============================================

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role as UserRole));
  }, [user]);

  const isStudent = useCallback((): boolean => {
    return user?.roles?.includes('student') || false;
  }, [user]);

  const isTeacher = useCallback((): boolean => {
    return user?.roles?.includes('editingteacher') || false;
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.roles?.includes('admin') || false;
  }, [user]);

  const canAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => allowedRoles.includes(role as UserRole));
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  // ============================================
  // VALUE
  // ============================================

  const value: AuthContextType = {
    user,
    token,                                                         // ← NUEVO: expuesto en el context
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    isStudent: isStudent(),
    isTeacher: isTeacher(),
    isAdmin: isAdmin(),
    login,
    logout,
    hasRole,
    canAccess,
    clearError,
    authMode: AUTH_MODE,
    retryAuth,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// ============================================
// HOOK PARA PROTEGER RUTAS
// ============================================

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { canAccess, isLoading, isAuthenticated } = useAuth();
  
  return {
    allowed: canAccess(allowedRoles),
    isLoading,
    isAuthenticated,
  };
}

// ============================================
// COMPONENTE HOC PARA PROTEGER RUTAS
// ============================================

interface WithRoleProtectionProps {
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, fallback, children }: WithRoleProtectionProps) {
  const { allowed, isLoading } = useRoleGuard(allowedRoles);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7F]"></div>
      </div>
    );
  }

  if (!allowed) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 text-center max-w-md">
          No tienes permisos para acceder a esta página. 
          Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}