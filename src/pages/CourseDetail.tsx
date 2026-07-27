// Página Interna de Curso del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  BarChart3,
  Star,
  Award,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { moodleApi } from '@/services/moodleApi';
import type { CourseDetail as CourseDetailType } from '@/types';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isTeacher } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (courseId) {
      loadCourse(parseInt(courseId));
    }
  }, [courseId]);

  const loadCourse = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // getCourseById ya obtiene internamente el contenido del curso y lo transforma.
      // No llamar a getCourseContent por separado para evitar sobreescribir las secciones
      // ya procesadas con datos crudos de la API.
      const courseData = await moodleApi.getCourseById(id);
      
      if (!courseData) {
        setError('No se pudo cargar el curso. Verifica que el curso exista y que tu cuenta tenga acceso.');
        return;
      }
      
      setCourse(courseData);
      
      // Expandir primera sección por defecto
      if (courseData.sections && courseData.sections.length > 0) {
        setExpandedSections([`section-${courseData.sections[0].id}`]);
      }
    } catch (err: any) {
      console.error('Error al cargar curso:', err);
      setError(err?.error || err?.message || 'Error al cargar el curso. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleIcon = (modname: string) => {
    const iconMap: Record<string, any> = {
      'resource': FileText,
      'page': BookOpen,
      'forum': MessageSquare,
      'quiz': CheckCircle2,
      'assign': Edit,
      'video': PlayCircle,
      'supervideo': PlayCircle,
      'hvp': PlayCircle,
      'h5pactivity': PlayCircle,
      'certificate': Award,
      'url': FileText,
      'folder': BookOpen,
      'scorm': PlayCircle,
    };
    return iconMap[modname] || FileText;
  };

  const getModuleLabel = (modname: string) => {
    const labels: Record<string, string> = {
      resource: 'Recurso',
      page: 'Página',
      forum: 'Foro',
      quiz: 'Cuestionario',
      assign: 'Tarea',
      video: 'Video',
      hvp: 'Contenido Interactivo',
      certificate: 'Certificado',
      label: 'Etiqueta',
      url: 'Enlace',
      book: 'Libro',
      folder: 'Carpeta',
    };
    return labels[modname] || modname;
  };

  // Navegar a un módulo específico
  const navigateToModule = (sectionIndex: number) => {
    if (course && course.sections && course.sections[sectionIndex]) {
      const section = course.sections[sectionIndex];
      navigate(`/courses/${course.id}/modules/${section.id}`);
    }
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a cursos
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Curso no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/courses')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a cursos
      </Button>

      {/* Course Header */}
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-48 md:h-64 rounded-xl overflow-hidden relative"
          style={{ 
            backgroundColor: (() => {
              const colors = ['#8B9A7D', '#ce8f88', '#6B8F71', '#D4845A', '#5C7A6B'];
              const index = course.fullname.charCodeAt(0) % colors.length;
              return colors[index];
            })()
          }}
        >
          {course.courseimage && (
            <img 
              src={course.courseimage} 
              alt={course.fullname}
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          )}
          <div 
            className="w-full h-full items-center justify-center"
            style={{ display: course.courseimage ? 'none' : 'flex' }}
          >
            <BookOpen className="w-24 h-24 text-white/30" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Course Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0">
                  {course.categoryname || 'General'}
                </Badge>
                {course.completed && (
                  <Badge className="bg-green-500 text-white border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{course.fullname}</h1>
              <p className="text-white/80 mt-1">{course.shortname}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isTeacher && (
                <>
                  <Button variant="secondary" asChild>
                    <Link to={`/courses/${course.id}/stats`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Estadísticas
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link to={`/grades?course=${course.id}`}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Calificaciones
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {!isTeacher && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{course.enrolledusercount || 0}</p>
                <p className="text-xs text-gray-500">Estudiantes</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {course.sections?.reduce((acc, s) => acc + (s.modules?.length || 0), 0) || 0}
              </p>
              <p className="text-xs text-gray-500">Módulos</p>
            </div>
          </CardContent>
        </Card>

        {!isTeacher && (
          <Link to={`/grades?course=${course.id}`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">Ver mis calificaciones</p>
                  <p className="text-xs text-gray-500">Calificaciones en este curso</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{course.progress || 0}%</p>
              <p className="text-xs text-gray-500">Progreso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - estilo Domestika: contenido principal + sidebar sticky alineado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Course Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
              {isTeacher && <TabsTrigger value="participants">Participantes</TabsTrigger>}
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Progress Bar */}
              {!isTeacher && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tu progreso</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-3" />
                  </CardContent>
                </Card>
              )}

              {/* Sections Accordion */}
              <Accordion
                type="multiple"
                value={expandedSections}
                onValueChange={setExpandedSections}
                className="space-y-3"
              >
                {course.sections?.map((section, index) => {
                  const total = section.modules?.length || 0;
                  const done = section.modules?.filter(m => m.completiondata?.state === 1).length || 0;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <AccordionItem
                      key={section.id}
                      value={`section-${section.id}`}
                      className="border rounded-xl overflow-hidden bg-white dark:bg-gray-900"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-4 text-left w-full">
                          <div className="w-10 h-10 rounded-full bg-[#ce8f88]/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[#ce8f88]">
                              {String(section.section || index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {section.name || `Unidad ${index + 1}`}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{done}/{total} lecciones</span>
                              <Progress value={pct} className="h-1.5 flex-1 max-w-[160px]" />
                              <span className="text-xs text-gray-500">{pct}%</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {section.summary && (
                          <div
                            className="text-sm text-gray-600 dark:text-gray-300 mb-4 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.summary }}
                          />
                        )}

                        <div className="space-y-1">
                          {section.modules?.map((module, mIdx) => {
                            const ModuleIcon = getModuleIcon(module.modname);
                            const isClickable = module.uservisible && module.url;
                            const completed = module.completiondata?.state === 1;

                            const moduleContent = (
                              <div className={cn(
                                "flex items-center gap-4 p-3 rounded-lg transition-colors w-full",
                                isClickable
                                  ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                  : "opacity-60 cursor-not-allowed"
                              )}>
                                <span className="text-xs text-gray-400 w-6 text-right">{String(mIdx + 1).padStart(2, '0')}</span>
                                <div className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                                  completed ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"
                                )}>
                                  <ModuleIcon className={cn(
                                    "w-4 h-4",
                                    completed ? "text-green-600" : "text-gray-500 dark:text-gray-400"
                                  )} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {module.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {getModuleLabel(module.modname)}
                                  </p>
                                </div>

                                {completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <PlayCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                            );

                            return (
                              <div key={module.id}>
                                {isClickable ? (
                                  <a
                                    href={module.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block no-underline"
                                  >
                                    {moduleContent}
                                  </a>
                                ) : (
                                  moduleContent
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => navigateToModule(index)}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Ver unidad completa
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Descripción del curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: course.summary || '<p class="text-gray-500">No hay descripción disponible</p>'
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {isTeacher && (
              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle>Participantes</CardTitle>
                    <CardDescription>Estudiantes inscriptos en este curso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">
                      Los participantes se cargarán aquí
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column - Sidebar (sticky, alineado con módulos y progreso) */}
        <div className="space-y-6 lg:sticky lg:top-6 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isTeacher && (
                <Button className="w-full bg-[#ce8f88] hover:bg-[#b87f78]">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {course.progress && course.progress >= 100
                    ? 'Ir al curso'
                    : course.progress && course.progress > 0
                      ? 'Continuar'
                      : 'Iniciar curso'}
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/certificates">
                  <Award className="w-4 h-4 mr-2" />
                  Ver certificado
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton para carga
function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      
      <Skeleton className="h-64 w-full rounded-xl" />
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-10 w-48 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// Importar iconos adicionales
import { 
  MessageSquare, 
  Edit 
} from 'lucide-react';

export default CourseDetail;
