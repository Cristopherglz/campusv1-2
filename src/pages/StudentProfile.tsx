// Página de Perfil del Estudiante para Profesores del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  BookOpen, 
  Clock,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Phone,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Clock3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useMoodleImageUrl } from '@/hooks/useMoodleImageUrl';
import { moodleApi } from '@/services/moodleApi';
import { getSucursalNames } from '@/lib/sucursales';
import type { User, Course, Grade } from '@/types';

interface StudentData {
  user: User | null;
  courses: Course[];
  grades: Grade[];
  activityStats: {
    lastAccess: number;
    totalTime: number;
    activitiesCompleted: number;
    activitiesTotal: number;
  };
}

export function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const { isTeacher } = useAuth();
  const navigate = useNavigate();
  const [expandedSucursales, setExpandedSucursales] = useState(false);
  
  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentData(parseInt(studentId));
    }
  }, [studentId]);

  const loadStudentData = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener información del estudiante
      const userData = await moodleApi.getUserProfile(id);
      
      if (!userData) {
        setError('Estudiante no encontrado');
        return;
      }
      
      // Obtener cursos del estudiante
      const userCourses = await moodleApi.getUserCourses(id);
      
      // Obtener calificaciones del estudiante
      const userGrades = await moodleApi.getAllUserGrades(id);
      
      setData({
        user: userData,
        courses: userCourses || [],
        grades: userGrades || [],
        activityStats: {
          lastAccess: userData.lastaccess || 0,
          totalTime: 0,
          activitiesCompleted: 0,
          activitiesTotal: 0,
        }
      });
    } catch (err: any) {
      console.error('Error al cargar datos del estudiante:', err);
      setError('Error al cargar los datos del estudiante');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const getSucursal = (user: User | null): string => {
    if (!user?.customfields) return 'No asignada';
    const sucursalField = user.customfields.find((f: { shortname: string; value?: string }) => f.shortname === 'sucursales');
    return sucursalField?.value || 'No asignada';
  };

  const getProvincia = (user: User | null): string => {
    if (!user?.customfields) return '-';
    const provinciaField = user.customfields.find((f: { shortname: string; value?: string }) => f.shortname === 'PROVINCIA');
    return provinciaField?.value || '-';
  };

  // Calcular promedio general
  const averageGrade = data?.grades?.length 
    ? data.grades.reduce((sum, g) => sum + (g.grade || 0), 0) / data.grades.length 
    : 0;

  // Calcular progreso promedio
  const averageProgress = data?.courses?.length
    ? data.courses.reduce((sum, c) => sum + (c.progress || 0), 0) / data.courses.length
    : 0;

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md">
          Esta página solo está disponible para instructores.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <StudentProfileSkeleton />;
  }

  if (error || !data?.user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a estudiantes
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Estudiante no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { user, courses, grades } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil del Estudiante</h1>
          <p className="text-gray-600">Información detallada del alumno</p>
        </div>
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de perfil */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <StudentProfileAvatar user={user} />
              <h2 className="text-xl font-bold text-gray-900">{user.fullname}</h2>
              <p className="text-gray-500">{user.email}</p>
              <StudentSucursalesDisplay user={user} expanded={expandedSucursales} onToggle={() => setExpandedSucursales(!expandedSucursales)} />
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Último acceso</span>
                  <span className={`text-sm font-medium ${
                    !user.lastaccess || (Math.floor(Date.now() / 1000) - user.lastaccess) > 7 * 86400
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {formatLastAccess(user.lastaccess)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Cursos inscritos</span>
                  <span className="text-sm font-medium">{courses.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Promedio general</span>
                  <span className={`text-sm font-medium ${
                    averageGrade >= 70 ? 'text-green-600' : averageGrade >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {averageGrade.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de contacto */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{user.email || 'No disponible'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-medium">{user.phone1 || 'No disponible'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Ciudad</p>
                  <p className="text-sm font-medium">{user.city || 'No disponible'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Provincia</p>
                  <p className="text-sm font-medium">{getProvincia(user)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Institución</p>
                  <p className="text-sm font-medium">{user.institution || 'No disponible'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Departamento</p>
                  <p className="text-sm font-medium">{user.department || 'No disponible'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con más información */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="grades">Calificaciones</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Inscritos</CardTitle>
              <CardDescription>{courses.length} curso(s) en total</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">El estudiante no tiene cursos inscritos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{course.fullname}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {course.progress || 0}% progreso
                          </span>
                          {course.completed && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <Progress value={course.progress || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Calificaciones</CardTitle>
              <CardDescription>Promedio general: {averageGrade.toFixed(1)}</CardDescription>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay calificaciones registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grades
                    .filter(g => g.grade !== undefined)
                    .sort((a, b) => (b.dategraded || 0) - (a.dategraded || 0))
                    .map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{grade.itemname}</p>
                        <p className="text-xs text-gray-500">{grade.coursename}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {grade.dategraded ? new Date(grade.dategraded * 1000).toLocaleDateString('es-ES') : '-'}
                        </span>
                        <Badge className={`${
                          (grade.grade || 0) >= 70 
                            ? 'bg-green-100 text-green-700' 
                            : (grade.grade || 0) >= 60 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {grade.grade?.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Clock3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">
                    {formatLastAccess(user.lastaccess)}
                  </p>
                  <p className="text-sm text-blue-600">Último acceso</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round(averageProgress)}%
                  </p>
                  <p className="text-sm text-green-600">Progreso promedio</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <CheckCircle2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {courses.filter(c => c.completed).length}
                  </p>
                  <p className="text-sm text-purple-600">Cursos completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para mostrar avatar del estudiante con imagen de Moodle
function StudentProfileAvatar({ user }: { user: User }) {
  const profileImageUrl = useMoodleImageUrl(user.profileimageurl);
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <Avatar className="w-24 h-24 mb-4">
      <AvatarImage 
        src={profileImageUrl} 
        alt={user.fullname} 
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white text-2xl">
        {getInitials(user.fullname)}
      </AvatarFallback>
    </Avatar>
  );
}

// Componente para mostrar sucursales con nombres y funcionalidad expandible
function StudentSucursalesDisplay({ user, expanded, onToggle }: { user: User; expanded: boolean; onToggle: () => void }) {
  const sucursalField = user.customfields?.find((f: { shortname: string; value?: string }) => f.shortname === 'sucursales');
  const sucursalIndices = sucursalField?.value || '';
  const sucursales = getSucursalNames(sucursalIndices);
  const showToggle = sucursales.length > 5;
  const visibleSucursales = expanded ? sucursales : sucursales.slice(0, 5);
  const hiddenCount = sucursales.length - 5;

  if (!sucursalIndices || sucursales.length === 0) {
    return (
      <Badge className="mt-2" variant="secondary">
        No asignada
      </Badge>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-1">
      {visibleSucursales.map((name, idx) => (
        <Badge key={idx} variant="secondary" className="text-xs">
          {name}
        </Badge>
      ))}
      {showToggle && (
        <button
          onClick={onToggle}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 transition-colors"
        >
          {expanded ? '▲ Mostrar menos' : `▼ +${hiddenCount} más`}
        </button>
      )}
    </div>
  );
}

function StudentProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>

      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default StudentProfile;