// Página de Recuperación de Contraseña del Campus Duomo LMS - Rediseño 2025
// Diseño consistente con la página de Login

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { DuomoLogo } from '@/components/DuomoLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      setIsLoading(true);
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessView = () => (
    <div className="min-h-screen flex">
      {/* Columna Izquierda - Contenido */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Logo - Centrado */}
          <div className="mb-10 flex justify-center">
            <DuomoLogo className="h-16 w-auto object-contain" />
          </div>

          {/* Contenido de Éxito */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Correo Enviado!
              </h1>
              <p className="text-gray-600">
                Revisa tu bandeja de entrada
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-800">
                Hemos enviado instrucciones para restablecer tu contraseña a:
              </p>
              <p className="font-semibold text-blue-900 mt-2 break-all">{email}</p>
            </div>

            <Button
              asChild
              className="w-full h-14 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] hover:from-[#7A8970] hover:to-[#5A6950] text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-lg shadow-[#8B9A7D]/25"
            >
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Link>
            </Button>
          </div>

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
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://campus.duomo.com.ar/pluginfile.php/1/theme_academi/loginbg/1742997622/portada_login_2.png)'
          }}
        />
      </div>
    </div>
  );

  if (success) {
    return <SuccessView />;
  }

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
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-gray-500">
              Ingresa tu correo y te enviaremos instrucciones para recuperar tu acceso
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-12 h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-[#8B9A7D] focus:ring-[#8B9A7D] transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] hover:from-[#7A8970] hover:to-[#5A6950] text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-lg shadow-[#8B9A7D]/25"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  <span>Enviar Instrucciones</span>
                </div>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm font-medium text-[#8B9A7D] hover:text-[#6B7A5D] inline-flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>

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

export default ForgotPassword;
