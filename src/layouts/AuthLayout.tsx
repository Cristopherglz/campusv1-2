// Layout de Autenticación para el Campus Duomo LMS
// Diseño basado en el login oficial de campus.duomo.com.ar

import type { ReactNode } from 'react';
import { DuomoLogo } from '@/components/DuomoLogo';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[450px] xl:w-[500px] bg-white flex flex-col">
        {/* Header con logo */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <DuomoLogo className="h-8 w-auto" />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-8">
          {/* Logo grande centrado */}
          <div className="flex justify-center mb-8">
            <DuomoLogo className="h-16 w-auto" />
          </div>

          {/* Title */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Heladería Duomo. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Image - Helado Artesanal */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/login-background.jpg')`,
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}

export default AuthLayout;
