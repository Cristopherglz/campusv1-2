// Página de Listado de Cursos del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Users, 
  ChevronRight, 
  Star,
  GraduationCap,
  LayoutGrid,
  List,
  CheckCircle2,
  PlayCircle,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMoodleImageUrl } from '@/hooks/useMoodleImageUrl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { moodleApi } from '@/services/moodleApi';
import type { Course } from '@/types';

export function Courses() {
  const { isTeacher } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchQuery, categoryFilter, statusFilter, sortBy]);

const loadCourses = async () => {
  try {
    setIsLoading(true);
    const data = await moodleApi.getUserCourses();
    // 👇 AGREGAR ESTO TEMPORALMENTE
    console.log('CURSOS RAW:', JSON.stringify(data.slice(0,2), null, 2));
    console.log('overviewfiles[0]:', data[0]?.overviewfiles);
    console.log('courseimage[0]:', data[0]?.courseimage);
    setCourses(data);
  } catch (error) {
    console.error('Error al cargar cursos:', error);
  } finally {
    setIsLoading(false);
  }
};

  const applyFilters = () => {
    let result = [...courses];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course => 
        course.fullname.toLowerCase().includes(query) ||
        course.shortname.toLowerCase().includes(query) ||
        course.summary?.toLowerCase().includes(query)
      );
    }

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      result = result.filter(course => course.categoryid?.toString() === categoryFilter);
    }

    // Filtrar por estado
    if (statusFilter === 'completed') {
      result = result.filter(course => course.completed);
    } else if (statusFilter === 'inprogress') {
      result = result.filter(course => !course.completed && course.progress && course.progress > 0);
    } else if (statusFilter === 'notstarted') {
      result = result.filter(course => !course.progress || course.progress === 0);
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullname.localeCompare(b.fullname);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'recent':
          return (b.lastaccess || 0) - (a.lastaccess || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(result);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const getStatusBadge = (course: Course) => {
    if (course.completed) {
      return <Badge className="bg-green-100 text-green-700">Completado</Badge>;
    }
    if (course.progress && course.progress > 0) {
      return <Badge className="bg-blue-100 text-blue-700">En Progreso</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700">No Iniciado</Badge>;
  };

  // Obtener categorías únicas
  const categories = Array.from(new Set(courses.map(c => c.categoryid).filter(Boolean)));

  if (isLoading) {
    return <CoursesSkeleton viewMode={viewMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
          <p className="text-gray-600 mt-1">
            {isTeacher 
              ? 'Gestiona los cursos que impartes'
              : 'Explora y continúa tu aprendizaje'
            }
          </p>
        </div>
        {isTeacher && (
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600">
            <BookOpen className="w-4 h-4 mr-2" />
            Crear Curso
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(catId => (
                    <SelectItem key={catId} value={catId?.toString() || ''}>
                      {courses.find(c => c.categoryid === catId)?.categoryname || `Categoría ${catId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="inprogress">En Progreso</SelectItem>
                  <SelectItem value="notstarted">No Iniciados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <span className="mr-2">Ordenar</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="progress">Progreso</SelectItem>
                  <SelectItem value="recent">Reciente</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none rounded-l-md"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none rounded-r-md"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredCourses.length}</span> de{' '}
          <span className="font-medium">{courses.length}</span> cursos
        </p>
      </div>

      {/* Courses Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course}
              getStatusBadge={getStatusBadge}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <CourseListItem 
              key={course.id} 
              course={course}
              getStatusBadge={getStatusBadge}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron cursos
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery 
              ? 'No hay cursos que coincidan con tu búsqueda. Intenta con otros términos.'
              : 'No tienes cursos asignados. Contacta al administrador para más información.'
            }
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de curso
interface CourseCardProps {
  course: Course;
  getStatusBadge: (course: Course) => React.ReactNode;
  isTeacher: boolean;
}

function CourseCard({ course, getStatusBadge, isTeacher }: CourseCardProps) {
  const courseImageUrl = useMoodleImageUrl(course.courseimage); // ← directo, sin hook (ya tiene token)
  const [imgError, setImgError] = useState(false); // ← estado reactivo

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
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden">
      <div 
        className="relative h-40 overflow-hidden"
        style={{ backgroundColor: getCourseColor(course.fullname) }}
      >
        {courseImageUrl && !imgError ? (
          <img 
            src={courseImageUrl} 
            alt={course.fullname}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)} // ← limpio y reactivo
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-white/50" />
          </div>
        )}
        {/* badges encima */}
        <div className="absolute top-3 right-3">{getStatusBadge(course)}</div>
        {course.isfavourite && (
          <div className="absolute top-3 left-3">
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
          {course.fullname}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {course.summary || 'Sin descripción'}
        </p>

        {/* Progress */}
        {!isTeacher && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium">{course.progress || 0}%</span>
            </div>
            <Progress value={course.progress || 0} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.enrolledusercount || 0}</span>
          </div>
          {course.startdate && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(course.startdate * 1000).toLocaleDateString('es-ES')}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600" asChild>
          <Link to={`/courses/${course.id}`}>
            {course.progress && course.progress > 0 ? 'Continuar' : 'Iniciar Curso'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Componente de item de lista de curso
interface CourseListItemProps extends CourseCardProps {}

function CourseListItem({ course, getStatusBadge, isTeacher }: CourseListItemProps) {
  const courseImageUrl = useMoodleImageUrl(course.courseimage);

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
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div 
          className="w-full md:w-48 h-32 md:h-auto flex-shrink-0 overflow-hidden"
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
            className="w-full h-full items-center justify-center min-h-[120px]"
            style={{ display: courseImageUrl ? 'none' : 'flex' }}
          >
            <GraduationCap className="w-12 h-12 text-white/50" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(course)}
                {course.isfavourite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                {course.fullname}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {course.summary || 'Sin descripción'}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolledusercount || 0} estudiantes</span>
                </div>
                {course.categoryname && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.categoryname}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              {!isTeacher && (
                <div className="w-full md:w-32">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{course.progress || 0}%</span>
                  </div>
                  <Progress value={course.progress || 0} className="h-2" />
                </div>
              )}
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600" asChild>
                <Link to={`/courses/${course.id}`}>
                  {course.progress && course.progress > 0 ? (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Iniciar
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Skeleton para carga
function CoursesSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-5">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="flex">
              <Skeleton className="w-48 h-32 flex-shrink-0" />
              <div className="flex-1 p-5">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Courses;
