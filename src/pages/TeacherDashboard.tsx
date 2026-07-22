// Dashboard para Profesores del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  GraduationCap,
  CheckCircle,
  User,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import type { Course, User as UserType } from '@/types';

interface DashboardData {
  user: any;
  courses: Course[];
  allStudents: UserType[];
  inactiveStudents: UserType[];
  stats: {
    totalCourses: number;
    inactiveStudentsCount: number;
    averageProgress: number;
  };
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await moodleApi.getTeacherDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatLastAccess = (timestamp?: number) => {
    if (!timestamp) return 'Nunca';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 3600) return 'Hace minutos';
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
    return 'Hace +7 días';
  };

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Error al cargar el dashboard</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const { courses, inactiveStudents, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header con saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, Prof. {user?.lastname}!
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus cursos y estudiantes
          </p>
        </div>
      </div>

      {/* Stats Cards - Solo 2 cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-xs text-gray-500">Cursos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                <p className="text-xs text-gray-500">Progreso Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Cursos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Mis Cursos</CardTitle>
                <CardDescription>Gestiona tus cursos activos</CardDescription>
              </div>
              <Link to="/courses">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!Array.isArray(courses) || courses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes cursos asignados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.slice(0, 4).map((course) => (
                    <div 
                      key={course.id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{course.fullname}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {course.summary || 'Sin descripción'}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrolledusercount || 0} estudiantes
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {course.progress || 0}% progreso
                          </span>
                        </div>
                      </div>
                      <Link to={`/courses/${course.id}`}>
                        <Button size="sm" variant="outline">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Estudiantes sin actividad como card clickable */}
        <div className="space-y-4">
          {/* Estudiantes sin actividad - Ahora es un botón/card clickable */}
          <Link to="/statistics">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Estudiantes sin Actividad
                  </CardTitle>
                  <CardDescription>Alertas de inactividad (7+ días)</CardDescription>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </CardHeader>
              <CardContent>
                {!Array.isArray(inactiveStudents) || inactiveStudents.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">¡Todos los estudiantes están activos!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-red-600">{inactiveStudents.length}</span> estudiantes sin actividad
                    </p>
                    <div className="space-y-2">
                      {inactiveStudents.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-100">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{student.fullname}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {formatLastAccess(student.lastaccess)}
                          </Badge>
                        </div>
                      ))}
                      {inactiveStudents.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{inactiveStudents.length - 3} más...
                        </p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-2" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver estadísticas completas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
