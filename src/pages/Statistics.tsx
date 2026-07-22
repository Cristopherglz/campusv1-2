// Página de Estadísticas del Campus Duomo LMS - Solo para EditingTeacher

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Download,
  Award,
  Clock,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { getSucursalNames, getSucursalLabel, sharesBranch, buildSucursalOptions } from '@/lib/sucursales';
import type { Course, User } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';


interface StudentActivity {
  user: User;
  sucursalIndices: string;  // índices crudos del customfield
  sucursal: string;         // nombre(s) legible(s) para mostrar
  coursesCount: number;
  progress: number;
  lastActivity: number;
  activityScore: number;
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
      {sucursales.length === 0 && (
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

export function Statistics() {
  const { isTeacher, user: teacherUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentActivity[]>([]);
  const [sucursalOptions, setSucursalOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isTeacher) {
      loadStatistics();
    }
  }, [isTeacher]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, selectedSucursal]);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSucursal]);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);

      // Obtener sucursales del profesor logueado
      const teacherSucursalIndices = teacherUser?.customfields?.find(
        f => f.shortname === 'sucursales'
      )?.value;
      
      const coursesData = await moodleApi.getUserCourses();
      const allStudentsData = await moodleApi.getAllStudents(
        Array.isArray(coursesData) ? coursesData : []
      );

      setCourses(Array.isArray(coursesData) ? coursesData : []);

      // Calcular actividad de cada estudiante y filtrar por sucursal compartida
      const studentsWithActivity: StudentActivity[] = allStudentsData
        .map(student => {
          const sucursalField = student.customfields?.find(
            (f: { shortname: string; value: string }) => f.shortname === 'sucursales'
          );
          const sucursalIndices = sucursalField?.value || '';
          const coursesCount = student.enrolledCourses?.length || 0;
          const progress = (student.enrolledCourses?.reduce((sum, c) => sum + (c.progress || 0), 0) ?? 0) / (coursesCount || 1);
          const lastActivity = student.lastaccess || student.lastcourseaccess || 0;
          
          // Calcular score de actividad (0-100)
          // Basado en: progreso (40%), recencia de acceso (40%), cantidad de cursos (20%)
          const now = Math.floor(Date.now() / 1000);
          const daysSinceAccess = lastActivity ? (now - lastActivity) / 86400 : 999;
          const recencyScore = Math.max(0, 100 - (daysSinceAccess * 5));
          const activityScore = (progress * 0.4) + (recencyScore * 0.4) + (Math.min(coursesCount * 10, 20) * 0.2);

          return {
            user: student,
            sucursalIndices,
            sucursal: getSucursalLabel(sucursalIndices),
            coursesCount,
            progress: Math.round(progress),
            lastActivity,
            activityScore: Math.round(activityScore),
          };
        })
        .filter(s => {
          if (!teacherSucursalIndices) return false;
          // Excluir usuarios que tienen el índice 95 (Supervisor) en sus sucursales
          // ya que ese índice identifica a supervisores/admins en el sistema
          const userIndices = (s.sucursalIndices || '').split(',').map(i => i.trim());
          if (userIndices.includes('95')) return false;
          return sharesBranch(teacherSucursalIndices, s.sucursalIndices);
        });

      // Ordenar por actividad (mayor a menor)
      studentsWithActivity.sort((a, b) => b.activityScore - a.activityScore);

      // Construir opciones dinámicas de sucursal
      const options = buildSucursalOptions(studentsWithActivity.map(s => s.sucursalIndices));
      setSucursalOptions(options);
      
      setStudents(studentsWithActivity);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setCourses([]);
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
      result = result.filter(s => 
        s.user.fullname?.toLowerCase().includes(query) ||
        s.user.email?.toLowerCase().includes(query) ||
        s.sucursal?.toLowerCase().includes(query)
      );
    }

    // Filtrar por sucursal (por índice)
    if (selectedSucursal !== 'all') {
      result = result.filter(s => {
        if (!s.sucursalIndices) return false;
        return s.sucursalIndices
          .split(',')
          .map(i => i.trim())
          .includes(selectedSucursal);
      });
    }

    setFilteredStudents(result);
  };

  // Calcular KPIs
  const totalStudents = students.length;
  const completedCourses = courses.filter(c => c.completed).length;
  const completionRate = courses.length > 0 ? (completedCourses / courses.length) * 100 : 0;
  const averageProgress = students.length > 0
    ? students.reduce((sum, s) => sum + s.progress, 0) / students.length
    : 0;

  // Datos para gráfico de progreso por curso
  const courseProgressData = courses.map(course => ({
    name: course.shortname || course.fullname.substring(0, 15),
    fullName: course.fullname,
    progress: course.progress || 0,
    students: course.enrolledusercount || 0,
  }));

  // Simular actividad semanal
  const weeklyActivityData = [
    { week: 'Semana 1', activity: 85 },
    { week: 'Semana 2', activity: 92 },
    { week: 'Semana 3', activity: 78 },
    { week: 'Semana 4', activity: 95 },
  ];

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

  const getActivityColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getActivityTextColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Sucursal', 'Cursos', 'Progreso', 'Última Actividad', 'Nivel de Actividad'];
    const rows = filteredStudents.map(s => [
      s.user.fullname,
      s.sucursal,
      s.coursesCount.toString(),
      `${s.progress}%`,
      formatLastAccess(s.lastActivity),
      s.activityScore.toString()
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estadisticas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          <BarChart3 className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md">
          Las estadísticas avanzadas solo están disponibles para instructores.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-1">
            Análisis del rendimiento de tus cursos
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-gray-500">Total Estudiantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Tasa de Finalización</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageProgress.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Progreso Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-gray-500">Cursos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso por curso */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso por Curso</CardTitle>
            <CardDescription>Porcentaje de avance promedio</CardDescription>
          </CardHeader>
          <CardContent>
            {courseProgressData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      fontSize={11}
                      tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Progreso']}
                    />
                    <Bar dataKey="progress" fill="#8B9A7D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Semanal</CardTitle>
            <CardDescription>Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Actividad']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="#E8927C" 
                    strokeWidth={3}
                    dot={{ fill: '#E8927C', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado de estudiantes con filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8B9A7D]" />
                Todos los Estudiantes
              </CardTitle>
              <CardDescription>
                Ordenados por nivel de actividad (mayor a menor)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar estudiante..."
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

          {/* Tabla de estudiantes */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron estudiantes
              </h3>
              <p className="text-gray-500">
                {searchQuery || selectedSucursal !== 'all' 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'No hay estudiantes registrados'
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
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Cursos</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Progreso</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Última Actividad</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Nivel de Actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
  <AvatarImage 
    src={student.user.profileimageurl} 
    alt={student.user.fullname}
    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = 'none';
    }}
  />
  <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white text-sm">
    {getInitials(student.user.fullname)}
  </AvatarFallback>
</Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{student.user.fullname}</p>
                              <p className="text-xs text-gray-500">{student.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <ExpandableSucursales sucursalIndices={student.sucursalIndices} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-600">{student.coursesCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={student.progress} className="h-2 w-20" />
                            <span className="text-sm text-gray-600">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={
                              !student.lastActivity || (Math.floor(Date.now() / 1000) - student.lastActivity) > 7 * 86400
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }>
                              {formatLastAccess(student.lastActivity)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress 
                                value={student.activityScore} 
                                className={`h-2 ${getActivityColor(student.activityScore)}`}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getActivityTextColor(student.activityScore)}`}>
                              {student.activityScore}
                            </span>
                          </div>
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

function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export default Statistics;