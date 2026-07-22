// App principal del Campus Duomo LMS
// Configuración de rutas y proveedores de contexto

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { Toaster } from '@/components/ui/sonner';

// Páginas
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { Profile } from '@/pages/Profile';
import { ProfileEdit } from '@/pages/ProfileEdit';
import { Courses } from '@/pages/Courses';
import { CourseDetail } from '@/pages/CourseDetail';
import { ModuleDetail } from '@/pages/ModuleDetail';
import { Students } from '@/pages/Students';
import { StudentProfile } from '@/pages/StudentProfile';
import { Statistics } from '@/pages/Statistics';
import { Certificates } from '@/pages/Certificates';
import { Notifications } from '@/pages/Notifications';
import { Messages } from '@/pages/Messages';
import { Settings } from '@/pages/Settings';
import { Grades } from '@/pages/Grades';

// Dashboard que redirige según rol
function DashboardRouter() {
  const { isTeacher, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7D]"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (isTeacher) {
    return <TeacherDashboard />;
  }
  
  return <StudentDashboard />;
}

// Componente para proteger rutas privadas con manejo de sesión expirada
function PrivateRoute() {
  const { isAuthenticated, isLoading, errorCode } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7D]"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el token expiró, redirigir al login con mensaje
  if (errorCode === 'invalidtoken' || errorCode === 'accessexception') {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname,
          message: 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.' 
        }} 
        replace 
      />
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

// Componente para redirigir usuarios autenticados
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7D]"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to={from} replace />;
}

// Componente para rutas de profesor
function TeacherRoute() {
  const { isAuthenticated, isTeacher, isLoading, errorCode } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7D]"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el token expiró, redirigir al login
  if (errorCode === 'invalidtoken' || errorCode === 'accessexception') {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname,
          message: 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.' 
        }} 
        replace 
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            Esta página solo está disponible para instructores.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// Layout wrapper para rutas privadas
function PrivateLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/">
        <Routes>
          {/* Rutas Públicas */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Rutas Privadas - Todos los usuarios */}
          <Route element={<PrivateRoute />}>
            <Route element={<PrivateLayout />}>
              {/* Dashboard - Redirige según rol */}
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              {/* Perfil */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              
              {/* Cursos */}
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/modules/:moduleId" element={<ModuleDetail />} />
              
              {/* Calificaciones */}
              <Route path="/grades" element={<Grades />} />
              
              {/* Certificados */}
              <Route path="/certificates" element={<Certificates />} />
              
              {/* Notificaciones y Mensajes */}
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              
              {/* Configuración */}
              <Route path="/settings" element={<Settings />} />
              
              {/* Páginas en construcción */}
              <Route path="/calendar" element={<ComingSoonPage title="Calendario" />} />
            </Route>
          </Route>

          {/* Rutas de Profesor */}
          <Route element={<TeacherRoute />}>
            <Route element={<PrivateLayout />}>
              <Route path="/students" element={<Students />} />
              <Route path="/students/:studentId" element={<StudentProfile />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/courses/:courseId/stats" element={<ComingSoonPage title="Estadísticas del Curso" />} />
              <Route path="/courses/:courseId/edit" element={<ComingSoonPage title="Editar Curso" />} />
            </Route>
          </Route>

          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

// Página de "Próximamente"
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gradient-to-br from-[#8B9A7D]/20 to-[#E8927C]/20 rounded-full flex items-center justify-center mb-6">
        <svg 
          className="w-12 h-12 text-[#8B9A7D]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 text-center max-w-md">
        Esta funcionalidad está en desarrollo. Pronto estará disponible.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
      >
        ← Volver
      </button>
    </div>
  );
}

// Página 404
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-9xl font-bold text-[#8B9A7D] mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <a 
        href="/app/dashboard"
        className="px-6 py-3 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] text-white font-medium rounded-lg hover:from-[#7A8970] hover:to-[#5A6950] transition-colors shadow-lg shadow-[#8B9A7D]/25"
      >
        Ir al Dashboard
      </a>
    </div>
  );
}

export default App;
