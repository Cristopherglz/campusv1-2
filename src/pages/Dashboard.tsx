// Página de Dashboard del Campus Duomo LMS
// Muestra información diferenciada según el rol del usuario

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar, 
  ChevronRight,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMoodleImageUrl } from '@/hooks/useMoodleImageUrl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { DashboardData, TeacherDashboardData, Course } from '@/types';
import { moodleApi } from '@/services/moodleApi';

// Datos de ejemplo para gráficos
const progressData = [
  { name: 'Ene', progress: 30 },
  { name: 'Feb', progress: 45 },
  { name: 'Mar', progress: 60 },
  { name: 'Abr', progress: 75 },
  { name: 'May', progress: 85 },
  { name: 'Jun', progress: 90 },
];

export function Dashboard() {
  const { user, isTeacher } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let data: DashboardData;
      
      if (isTeacher) {
        data = await moodleApi.getTeacherDashboard();
      } else {
        data = await moodleApi.getStudentDashboard();
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setError('Error al cargar los datos del dashboard');
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstname}
          </h1>
          <p className="text-gray-600 mt-1">
            {isTeacher 
              ? 'Aquí está el resumen de tus cursos y estudiantes'
              : 'Aquí está tu progreso y actividades pendientes'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-[#8B9A7F]/10 text-[#8B9A7F] hover:bg-[#8B9A7F]/20">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cursos"
          value={dashboardData?.progress?.totalCourses || 0}
          subtitle={isTeacher ? "Cursos que impartes" : "Cursos inscritos"}
          icon={BookOpen}
          trend={+2}
          color="duomo"
        />
        <StatCard
          title="Progreso"
          value={`${dashboardData?.progress?.averageProgress || 0}%`}
          subtitle="Promedio general"
          icon={TrendingUp}
          trend={+5}
          color="green"
        />
        <StatCard
          title={isTeacher ? "Estudiantes" : "Completados"}
          value={isTeacher 
            ? (dashboardData as TeacherDashboardData)?.courseStats?.reduce((sum, s) => sum + s.totalstudents, 0) || 0
            : dashboardData?.progress?.completedCourses || 0
          }
          subtitle={isTeacher ? "Total de estudiantes" : "Cursos finalizados"}
          icon={isTeacher ? Users : CheckCircle2}
          trend={+12}
          color="blue"
        />
        <StatCard
          title="Certificados"
          value={dashboardData?.certificates?.length || 0}
          subtitle="Certificados obtenidos"
          icon={Award}
          trend={+1}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{isTeacher ? 'Mis Cursos' : 'Cursos en Progreso'}</CardTitle>
                <CardDescription>
                  {isTeacher 
                    ? 'Cursos que estás impartiendo'
                    : 'Continúa donde lo dejaste'
                  }
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/courses">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.courses?.slice(0, 3).map((course) => (
                  <CourseProgressItem 
                    key={course.id} 
                    course={course}
                    isTeacher={isTeacher}
                  />
                ))}
                {(!dashboardData?.courses || dashboardData.courses.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tienes cursos {isTeacher ? 'asignados' : 'inscritos'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          {isTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Estudiantes</CardTitle>
                <CardDescription>Progreso de tus estudiantes por curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {!isTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
                <CardDescription>Evolución de tu aprendizaje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/courses">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {isTeacher ? 'Gestionar Cursos' : 'Explorar Cursos'}
                </Link>
              </Button>
              {isTeacher && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/students">
                    <Users className="w-4 h-4 mr-2" />
                    Mis Estudiantes
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/profile">
                  <Avatar className="w-4 h-4 mr-2">
                    <AvatarImage src={user?.profileimageurl} />
                    <AvatarFallback>{user?.firstname?.[0]}</AvatarFallback>
                  </Avatar>
                  Mi Perfil
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente para tarjetas de estadísticas
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
  color: 'duomo' | 'green' | 'blue' | 'purple';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    duomo: 'from-[#8B9A7F] to-[#7A896F]',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-500',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-4">
            <TrendingUp className={`w-4 h-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-sm text-gray-500">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para item de curso con progreso
interface CourseProgressItemProps {
  course: Course;
  isTeacher: boolean;
}

function CourseProgressItem({ course, isTeacher }: CourseProgressItemProps) {
  const courseImageUrl = useMoodleImageUrl(course.courseimage);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCourseColor = (name: string) => {
    const colors = ['#8B9A7D', '#E8927C', '#6B8F71', '#D4845A', '#5C7A6B'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
    if (fallback) fallback.style.display = 'flex';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div 
        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
        style={{ backgroundColor: getCourseColor(course.fullname) }}
      >
        {courseImageUrl && (
          <img 
            src={courseImageUrl} 
            alt={course.fullname}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
        <div 
          className="w-full h-full items-center justify-center text-white text-xs font-bold"
          style={{ display: courseImageUrl ? 'none' : 'flex' }}
        >
          {getInitials(course.fullname)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{course.fullname}</h4>
        <p className="text-sm text-gray-500">
          {isTeacher 
            ? `${course.enrolledusercount || 0} estudiantes`
            : `${course.progress || 0}% completado`
          }
        </p>
        {!isTeacher && (
          <Progress value={course.progress || 0} className="h-2 mt-2" />
        )}
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/courses/${course.id}`}>
          <ChevronRight className="w-5 h-5" />
        </Link>
      </Button>
    </div>
  );
}

// Skeleton para carga
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}
