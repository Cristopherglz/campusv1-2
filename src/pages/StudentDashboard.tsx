// Dashboard para Estudiantes del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import type { Course, Grade, Certificate } from '@/types';

interface DashboardData {
  user: any;
  courses: Course[];
  grades: Grade[];
  certificates: Certificate[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
    averageGrade: number;
    totalCertificates: number;
  };
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await moodleApi.getStudentDashboard();
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

  if (isLoading) {
    return <StudentDashboardSkeleton />;
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

  const { courses, grades, certificates, stats } = data;

  // Cursos en progreso (no completados)
  const inProgressCourses = Array.isArray(courses) 
    ? courses.filter(c => !c.completed).slice(0, 4)
    : [];

  return (
    <div className="space-y-6">
      {/* Header con saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstname}!
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí está tu progreso de aprendizaje
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-gray-600">
            {stats.completedCourses} de {stats.totalCourses} cursos completados
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgressCourses}</p>
                <p className="text-xs text-gray-500">Cursos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedCourses}</p>
                <p className="text-xs text-gray-500">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageGrade}</p>
                <p className="text-xs text-gray-500">Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                <p className="text-xs text-gray-500">Progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cursos en progreso */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Mis Cursos en Progreso</CardTitle>
                <CardDescription>Continúa donde lo dejaste</CardDescription>
              </div>
              <Link to="/courses">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {inProgressCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tienes cursos en progreso</p>
                  <Link to="/courses">
                    <Button variant="outline" className="mt-3">
                      Explorar cursos
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressCourses.map((course) => (
                    <div 
                      key={course.id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{course.fullname}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {course.summary || 'Sin descripción'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={course.progress || 0} className="h-2 w-24" />
                          <span className="text-xs text-gray-500">{course.progress || 0}%</span>
                        </div>
                      </div>
                      <Link to={`/courses/${course.id}`}>
                        <Button size="sm" variant="outline">
                          Continuar
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calificaciones recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Calificaciones Recientes</CardTitle>
                <CardDescription>Tus últimas evaluaciones</CardDescription>
              </div>
              <Link to="/grades">
                <Button variant="ghost" size="sm">
                  Ver todas
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!Array.isArray(grades) || grades.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aún no tienes calificaciones</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grades
                    .filter(g => g.grade !== undefined)
                    .sort((a, b) => (b.dategraded || 0) - (a.dategraded || 0))
                    .slice(0, 5)
                    .map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          (grade.grade || 0) >= 70 ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          <TrendingUp className={`w-5 h-5 ${
                            (grade.grade || 0) >= 70 ? 'text-green-600' : 'text-amber-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{grade.itemname}</p>
                          <p className="text-xs text-gray-500">{grade.coursename}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        (grade.grade || 0) >= 70 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {grade.grade?.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Solo Certificados */}
        <div className="space-y-4">
          {/* Certificados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#8B9A7D]" />
                Mis Certificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(certificates) || certificates.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Completa cursos para obtener certificados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{cert.course}</p>
                        <p className="text-xs text-gray-500">{cert.dateissued}</p>
                      </div>
                    </div>
                  ))}
                  {certificates.length > 3 && (
                    <Link to="/certificates">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver {certificates.length - 3} más
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
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

export default StudentDashboard;
