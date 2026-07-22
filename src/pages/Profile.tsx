// Página de Perfil de Usuario del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Edit2, 
  Award, 
  BookOpen, 
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  ChevronRight,
  Camera
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { moodleApi } from '@/services/moodleApi';
import type { User as UserType, Course, Certificate, Grade } from '@/types';

export function Profile() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos en paralelo
      const [userData, coursesData, certificatesData, gradesData] = await Promise.all([
        moodleApi.getUserProfile(authUser?.id),
        moodleApi.getUserCourses(authUser?.id),
        moodleApi.getUserCertificates(authUser?.id),
        moodleApi.getUserGrades(undefined, authUser?.id),
      ]);

      setUser(userData);
      setCourses(coursesData);
      setCertificates(certificatesData);
      setGrades(gradesData);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'No disponible';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información y revisa tu progreso
          </p>
        </div>
        <Button onClick={() => navigate('/profile/edit')}>
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={user?.profileimageurl} alt={user?.fullname} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-4xl">
                      {user?.fullname ? getInitials(user.fullname) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border hover:bg-gray-50 transition-colors"
                    onClick={() => navigate('/profile/edit')}
                  >
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">{user?.fullname}</h2>
                <p className="text-gray-500">@{user?.username}</p>
                <div className="flex gap-2 mt-3">
                  {user?.roles?.map((role) => (
                    <Badge 
                      key={role} 
                      variant="secondary"
                      className={role === 'editingteacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                    >
                      {role === 'editingteacher' ? 'Instructor' : 'Estudiante'}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Información de Contacto</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Correo Electrónico</p>
                      <p className="text-sm font-medium text-gray-900">{user?.email || 'No disponible'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900">{user?.phone1 || 'No disponible'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="text-sm font-medium text-gray-900">
                        {[user?.city, user?.country].filter(Boolean).join(', ') || 'No disponible'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Institución</p>
                      <p className="text-sm font-medium text-gray-900">{user?.institution || 'Heladería Duomo'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Información de Cuenta</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Miembro desde</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user?.firstaccess)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Último acceso</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user?.lastaccess)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="courses">Cursos</TabsTrigger>
              <TabsTrigger value="grades">Calificaciones</TabsTrigger>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                        <p className="text-xs text-gray-500">Cursos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {courses.filter(c => c.completed).length}
                        </p>
                        <p className="text-xs text-gray-500">Completados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                        <p className="text-xs text-gray-500">Certificados</p>
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
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (courses.length || 1))}%
                        </p>
                        <p className="text-xs text-gray-500">Progreso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Tus últimas acciones en la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Accediste a <Link to={`/courses/${course.id}`} className="text-amber-600 hover:underline">{course.fullname}</Link>
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(course.lastaccess)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay actividad reciente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              {user?.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre Mí</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 whitespace-pre-wrap">{user.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Cursos</CardTitle>
                  <CardDescription>Todos los cursos en los que estás inscrito</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div 
                        key={course.id} 
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={course.courseimage} alt={course.fullname} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                            {getInitials(course.fullname)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{course.fullname}</h4>
                          <p className="text-sm text-gray-500">{course.categoryname}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={course.progress || 0} className="h-2 flex-1" />
                            <span className="text-sm text-gray-600">{course.progress || 0}%</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/courses/${course.id}`}>
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No estás inscrito en ningún curso</p>
                        <Button className="mt-4" variant="outline" asChild>
                          <Link to="/courses">Explorar Cursos</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grades Tab */}
            <TabsContent value="grades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calificaciones</CardTitle>
                  <CardDescription>Tus calificaciones en los cursos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grades.slice(0, 10).map((grade, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{grade.itemname}</h4>
                          <p className="text-sm text-gray-500">{grade.coursename}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {grade.grade !== undefined ? grade.grade.toFixed(1) : '-'}
                          </p>
                          {grade.percentage !== undefined && (
                            <p className="text-sm text-gray-500">{grade.percentage.toFixed(0)}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {grades.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay calificaciones disponibles</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificados</CardTitle>
                  <CardDescription>Tus certificados obtenidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <div 
                        key={cert.id} 
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{cert.name}</h4>
                          <p className="text-sm text-gray-500">
                            Obtenido el {formatDate(cert.issuedate)}
                          </p>
                          {cert.code && (
                            <p className="text-xs text-gray-400">Código: {cert.code}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Descargar
                        </Button>
                      </div>
                    ))}
                    {certificates.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No tienes certificados aún</p>
                        <p className="text-sm mt-1">Completa cursos para obtener certificados</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Skeleton para carga
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <Skeleton className="w-32 h-32 rounded-full" />
                <Skeleton className="h-6 w-40 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
                <Skeleton className="h-6 w-20 mt-3" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
