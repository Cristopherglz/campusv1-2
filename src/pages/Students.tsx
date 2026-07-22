// Página de Estudiantes para Profesores del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  BookOpen, 
  Clock,
  ChevronRight,
  Building2,
  ChevronLeft,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { getSucursalLabel, getSucursalNames, sharesBranch, buildSucursalOptions } from '@/lib/sucursales';
import type { User, Course } from '@/types';

interface StudentWithCourses extends User {
  enrolledCourses?: Course[];
  sucursalIndices?: string;   // índices crudos del customfield
  sucursalLabel?: string;     // nombre(s) legible(s) para mostrar
}

const ITEMS_PER_PAGE = 20;

// Componente para mostrar sucursales con colapso si hay más de 5
function ExpandableSucursales({ sucursalIndices }: { sucursalIndices?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sucursales = getSucursalNames(sucursalIndices);
  const showToggle = sucursales.length > 5;
  const visibleSucursales = isExpanded ? sucursales : sucursales.slice(0, 5);
  const hiddenCount = sucursales.length - 5;

  return (
    <div className="flex flex-col gap-1">
      {visibleSucursales.map((name, idx) => (
        <Badge key={idx} variant="outline" className="text-xs w-fit max-w-[200px] truncate">
          <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{name}</span>
        </Badge>
      ))}
      {(!sucursalIndices || sucursales.length === 0) && (
        <Badge variant="outline" className="text-xs w-fit text-gray-400">
          No asignada
        </Badge>
      )}
      {showToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 text-left flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>▲ Mostrar menos</>
          ) : (
            <>▼ +{hiddenCount} más</>
          )}
        </button>
      )}
    </div>
  );
}

export function Students() {
  const { isTeacher, user: teacherUser } = useAuth();
  const [students, setStudents] = useState<StudentWithCourses[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithCourses[]>([]);
  const [sucursalOptions, setSucursalOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSucursales, setExpandedSucursales] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isTeacher) {
      loadStudents();
    }
  }, [isTeacher]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, selectedSucursal]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSucursal]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      
      // Obtener sucursales del profesor logueado
      const teacherSucursalIndices = teacherUser?.customfields?.find(
        f => f.shortname === 'sucursales'
      )?.value;

      // Obtener cursos del profesor
      const teacherCourses = await moodleApi.getUserCourses();
      
      if (!Array.isArray(teacherCourses) || teacherCourses.length === 0) {
        setStudents([]);
        return;
      }
      
      // Obtener todos los estudiantes (ya filtrados por rol=student en moodleApi)
      const allStudents = await moodleApi.getAllStudents(teacherCourses);
      
      // Enriquecer con datos de sucursal y filtrar por intersección de sucursales
      const studentsWithSucursal: StudentWithCourses[] = allStudents
        .map(student => {
          const sucursalField = student.customfields?.find(f => f.shortname === 'sucursales');
          const sucursalIndices = sucursalField?.value || '';
          return {
            ...student,
            sucursalIndices,
            sucursalLabel: getSucursalLabel(sucursalIndices),
          };
        })
        .filter(student => {
          // Si el profesor no tiene sucursales asignadas, no mostrar ningún estudiante
          if (!teacherSucursalIndices) return false;
          // Excluir usuarios que tienen el índice 95 (Supervisor) en sus sucursales
          const userIndices = (student.sucursalIndices || '').split(',').map(i => i.trim());
          if (userIndices.includes('95')) return false;
          // Solo mostrar estudiantes que compartan al menos una sucursal con el profesor
          return sharesBranch(teacherSucursalIndices, student.sucursalIndices);
        });
      
      // Construir opciones de sucursal dinámicamente a partir de los estudiantes cargados
      const options = buildSucursalOptions(studentsWithSucursal.map(s => s.sucursalIndices));
      setSucursalOptions(options);
      
      setStudents(studentsWithSucursal);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...students];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(student => 
        student.fullname?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.sucursalLabel?.toLowerCase().includes(query)
      );
    }

    // Filtrar por sucursal (por índice)
    if (selectedSucursal !== 'all') {
      result = result.filter(student => {
        if (!student.sucursalIndices) return false;
        return student.sucursalIndices
          .split(',')
          .map(i => i.trim())
          .includes(selectedSucursal);
      });
    }

    setFilteredStudents(result);
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

  // Paginación
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md">
          Esta página solo está disponible para instructores.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <StudentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Estudiantes</h1>
          <p className="text-gray-600 mt-1">
            {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''} en total
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
              <SelectTrigger className="w-full sm:w-64">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {sucursalOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron estudiantes
              </h3>
              <p className="text-gray-500">
                {searchQuery || selectedSucursal !== 'all' 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Aún no tienes estudiantes matriculados en tus cursos'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Estudiante</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Sucursal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Cursos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Última Actividad</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={student.profileimageurl} 
                                alt={student.fullname} 
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white text-sm">
                                {getInitials(student.fullname)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{student.fullname}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <ExpandableSucursales sucursalIndices={student.sucursalIndices} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {student.enrolledCourses?.length || 0} curso(s)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.enrolledCourses?.slice(0, 2).map(course => (
                              <Badge key={course.id} variant="secondary" className="text-xs">
                                {course.shortname || course.fullname.substring(0, 15)}
                              </Badge>
                            ))}
                            {(student.enrolledCourses?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(student.enrolledCourses?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={
                              !student.lastaccess || (Math.floor(Date.now() / 1000) - student.lastaccess) > 7 * 86400
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }>
                              {formatLastAccess(student.lastaccess)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/students/${student.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver perfil
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} de {filteredStudents.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronFirst className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronLast className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-64" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Students;