// Layout principal del Campus Duomo LMS - Sidebar mejorado con navegación por rol
// Incluye avatar, nombre, navegación diferenciada por rol (student/teacher)

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  User, 
  BarChart3, 
  Award, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  ChevronDown,
  GraduationCap,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMoodleImageUrl } from '@/hooks/useMoodleImageUrl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { DuomoLogo } from '@/components/DuomoLogo';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
  section?: string;
}

// Navegación para ESTUDIANTES
const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { label: 'Mis Cursos', href: '/courses', icon: BookOpen, roles: ['student'] },
  { label: 'Calificaciones', href: '/grades', icon: GraduationCap, roles: ['student'] },
  { label: 'Certificados', href: '/certificates', icon: Award, roles: ['student'] },
  { label: 'Mensajes', href: '/messages', icon: MessageSquare, roles: ['student'], badge: 0 },
  { label: 'Notificaciones', href: '/notifications', icon: Bell, roles: ['student'], badge: 0 },
];

// Navegación para PROFESORES
const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['editingteacher'] },
  { label: 'Mis Cursos', href: '/courses', icon: BookOpen, roles: ['editingteacher'] },
  { label: 'Mis Estudiantes', href: '/students', icon: Users, roles: ['editingteacher'] },
  { label: 'Estadísticas', href: '/statistics', icon: BarChart3, roles: ['editingteacher'] },
  { label: 'Calificaciones', href: '/grades', icon: GraduationCap, roles: ['editingteacher'] },
  { label: 'Mensajes', href: '/messages', icon: MessageSquare, roles: ['editingteacher'], badge: 0 },
  { label: 'Notificaciones', href: '/notifications', icon: Bell, roles: ['editingteacher'], badge: 0 },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isStudent, isTeacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const profileImageUrl = useMoodleImageUrl(user?.profileimageurl);

  // Cargar contador de notificaciones
  useEffect(() => {
    setUnreadCount(2);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Seleccionar items de navegación según rol
  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = () => {
    if (isTeacher) return 'Instructor';
    if (isStudent) return 'Estudiante';
    return 'Usuario';
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || 
                    location.pathname.startsWith(`${item.href}/`);
    return (
      <Link
        to={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
          isActive 
            ? "bg-gradient-to-r from-[#8B9A7D] to-[#7A8970] text-white shadow-md" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
        title={!isSidebarOpen ? item.label : undefined}
      >
        <item.icon className={cn(
          "w-5 h-5 flex-shrink-0 transition-colors",
          isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
        )} />
        {isSidebarOpen && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge className="bg-red-500 text-white text-xs flex-shrink-0 border-0">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-100">
        <DuomoLogo 
          isCollapsed={!isSidebarOpen} 
          className={cn(
            "object-contain transition-all duration-300",
            isSidebarOpen ? "h-10 w-auto" : "h-8 w-8"
          )} 
        />
      </div>

      {/* User Info - Avatar y nombre */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-white shadow-md">
            <AvatarImage 
              src={profileImageUrl} 
              alt={user?.fullname} 
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white font-medium">
              {getInitials(user?.fullname || '')}
            </AvatarFallback>
          </Avatar>
          {isSidebarOpen && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-semibold text-gray-900 truncate">
                {user?.fullname}
              </p>
              <Badge variant="secondary" className="text-xs mt-1 bg-[#8B9A7D]/10 text-[#8B9A7D] border-0">
                {getRoleLabel()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
            location.pathname === '/settings'
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={!isSidebarOpen ? 'Configuración' : undefined}
        >
          <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
          {isSidebarOpen && <span>Configuración</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          title={!isSidebarOpen ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isSidebarOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 hidden lg:block shadow-sm",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Mobile Menu & Sidebar Toggle */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>

              {/* Breadcrumb */}
              <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Link to="/dashboard" className="hover:text-gray-900 transition-colors">
                  <Home className="w-4 h-4" />
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium capitalize">
                  {location.pathname.split('/')[1] || 'Dashboard'}
                </span>
              </nav>
            </div>

            {/* Center: Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar cursos..."
                  className="pl-10 w-full bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-[#8B9A7D]/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-100 rounded-full transition-all">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage 
                        src={profileImageUrl} 
                        alt={user?.fullname} 
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-[#8B9A7D] text-white text-xs">
                        {getInitials(user?.fullname || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.fullname}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 hidden sm:block text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.fullname}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
