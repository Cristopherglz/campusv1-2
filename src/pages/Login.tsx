// Página de Login del Campus Duomo LMS - Rediseño 2025
// Layout de dos columnas: formulario minimalista + panel visual

import { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DuomoLogo } from '@/components/DuomoLogo';

export function Login() {
  const { login, error, clearError, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'El usuario es requerido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    const success = await login(formData.username, formData.password);
    
    if (success) {
      if (formData.rememberMe) {
        localStorage.setItem('remember_username', formData.username);
      } else {
        localStorage.removeItem('remember_username');
      }
      
      window.location.href = '/dashboard';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Columna Izquierda - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Logo - Centrado */}
          <div className="mb-10 flex justify-center">
            <DuomoLogo className="h-16 w-auto object-contain" />
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a Campus Duomo
            </h1>
            <p className="text-gray-500">
              Tu plataforma de aprendizaje
            </p>
          </div>

          {/* Error Global */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`pl-12 h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-[#8B9A7D] focus:ring-[#8B9A7D] transition-all ${
                    formErrors.username ? 'border-red-300' : ''
                  }`}
                />
              </div>
              {formErrors.username && (
                <p className="text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`pl-12 pr-12 h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-[#8B9A7D] focus:ring-[#8B9A7D] transition-all ${
                    formErrors.password ? 'border-red-300' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                  disabled={isLoading}
                  className="border-gray-300 data-[state=checked]:bg-[#8B9A7D] data-[state=checked]:border-[#8B9A7D]"
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Recordarme
                </Label>
              </div>
              <a 
                href="/forgot-password" 
                className="text-sm text-[#8B9A7D] hover:text-[#6B7A5D] transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] hover:from-[#7A8970] hover:to-[#5A6950] text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-lg shadow-[#8B9A7D]/25"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-center text-sm text-gray-400">
              © 2026 Duomo S.A.
            </p>
          </div>
        </div>
      </div>

      {/* Columna Derecha - Panel Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Fondo con imagen */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://campus.duomo.com.ar/pluginfile.php/1/theme_academi/loginbg/1742997622/portada_login_2.png)'
          }}
        />
      </div>
    </div>
  );
}

export default Login;