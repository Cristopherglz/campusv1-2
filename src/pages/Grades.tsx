// Página de Calificaciones del Campus Duomo LMS - Rediseñada
import { useState, useEffect } from 'react';
import {
  GraduationCap, TrendingUp, Download, FileText, Filter, Search, Building2,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { sharesBranch, buildSucursalOptions } from '@/lib/sucursales';
import type { Grade, Course } from '@/types';
import { useSearchParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 20;

export function Grades() {
  const { isTeacher, user: teacherUser } = useAuth();
  const [searchParams] = useSearchParams();
  const courseFilterFromUrl = searchParams.get('course');

  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sucursalOptions, setSucursalOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(courseFilterFromUrl || 'all');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadGrades(); }, []);
  useEffect(() => { applyFilters(); }, [grades, selectedCourse, selectedSucursal, searchQuery]);
  useEffect(() => { setCurrentPage(1); }, [selectedCourse, selectedSucursal, searchQuery]);

  const loadGrades = async () => {
    try {
      setIsLoading(true);
      const coursesData = await moodleApi.getUserCourses();
      const safeCoursesData = Array.isArray(coursesData) ? coursesData : [];
      setCourses(safeCoursesData);

      if (isTeacher) {
        const teacherSucursalIndices = teacherUser?.customfields?.find(f => f.shortname === 'sucursales')?.value;
        const allStudentsData = await moodleApi.getAllStudents(safeCoursesData);
        const filteredStudents = allStudentsData.filter(student => {
          const studentSucursal = student.customfields?.find(f => f.shortname === 'sucursales')?.value;
          return sharesBranch(teacherSucursalIndices, studentSucursal);
        });
        const options = buildSucursalOptions(
          filteredStudents.map(s => s.customfields?.find(f => f.shortname === 'sucursales')?.value)
        );
        setSucursalOptions(options);
      }

      const gradesData = await moodleApi.getAllUserGrades();
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      setGrades([]); setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...grades];
    if (selectedCourse !== 'all') result = result.filter(g => g.courseid?.toString() === selectedCourse);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => g.itemname?.toLowerCase().includes(q) || g.coursename?.toLowerCase().includes(q));
    }
    setFilteredGrades(result);
  };

  const averageGrade = filteredGrades.length > 0
    ? filteredGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / filteredGrades.length : 0;
  const highestGrade = filteredGrades.length > 0 ? Math.max(...filteredGrades.map(g => g.grade || 0)) : 0;

  // Progreso general: total de cursos completados / total de cursos inscriptos
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.completed || (c.progress ?? 0) >= 100).length;
  const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  const exportToExcel = () => {
    const rows = filteredGrades.map(g => ({
      Curso: g.coursename || '',
      Actividad: g.itemname || '',
      Calificación: g.grade ?? '',
      Porcentaje: g.percentage ?? '',
      Fecha: g.dategraded ? new Date(g.dategraded * 1000).toLocaleDateString('es-AR') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
    XLSX.writeFile(wb, `calificaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getGradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-gray-400';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const totalPages = Math.ceil(filteredGrades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGrades = filteredGrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  if (isLoading) return <GradesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calificaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isTeacher ? 'Revisá el rendimiento de tus estudiantes' : 'Revisá tu rendimiento académico'}
          </p>
        </div>
        <Button onClick={exportToExcel} className="bg-[#ce8f88] hover:bg-[#b87f78] text-white">
          <Download className="w-4 h-4 mr-2" /> Exportar Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredGrades.length}</p>
              <p className="text-xs text-gray-500">Calificaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{averageGrade.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Promedio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{highestGrade.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Máxima</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ce8f88]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#ce8f88]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallProgress}%</p>
              <p className="text-xs text-gray-500">Progreso general</p>
              <p className="text-[10px] text-gray-400">{completedCourses}/{totalCourses} cursos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros + Tabla */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Historial de calificaciones</CardTitle>
              <CardDescription>
                {filteredGrades.length} calificación{filteredGrades.length !== 1 ? 'es' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-48" />
              </div>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Curso" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullname}</SelectItem>)}
                </SelectContent>
              </Select>
              {isTeacher && (
                <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                  <SelectTrigger className="w-48"><Building2 className="w-4 h-4 mr-2" /><SelectValue placeholder="Sucursal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {sucursalOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay calificaciones</h3>
              <p className="text-gray-500">Las calificaciones aparecerán acá cuando completes actividades evaluables.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Curso</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actividad</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Calificación</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGrades.map((g, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{g.coursename || '—'}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{g.itemname || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="outline" className={getGradeColor(g.grade)}>
                            {g.grade !== undefined ? g.grade.toFixed(1) : '—'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell">
                          {g.dategraded ? new Date(g.dategraded * 1000).toLocaleDateString('es-AR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronFirst className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}><ChevronLast className="w-4 h-4" /></Button>
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

function GradesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );
}

export default Grades;
