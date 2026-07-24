// Página de Certificados del Campus Duomo LMS
// Estudiantes: ven sus certificados propios.
// Instructores: ven sus certificados propios + listado por curso con estado por estudiante.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Share2, CheckCircle2, ExternalLink, Calendar, BookOpen,
  TrendingUp, Users, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { moodleApi } from '@/services/moodleApi';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/Loader';
import type { Certificate, Course, User } from '@/types';

export function Certificates() {
  const { isTeacher } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [isTeacher]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [certs, coursesData] = await Promise.all([
        moodleApi.getUserCertificates(),
        moodleApi.getUserCourses(),
      ]);
      setCertificates(Array.isArray(certs) ? certs : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      if (isTeacher) {
        const st = await moodleApi.getAllStudents(Array.isArray(coursesData) ? coursesData : []);
        setStudents(Array.isArray(st) ? st : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.completed || (c.progress ?? 0) >= 100).length;
  const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  const handleShare = async (cert: Certificate) => {
    const url = cert.downloadurl || '';
    if (navigator.share) {
      try { await navigator.share({ title: `Certificado: ${cert.course}`, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) return <div className="py-20"><Loader label="Cargando certificados..." /></div>;

  // Para instructores: por cada curso, "estudiantes con certificado" vs "sin certificado"
  // Nota: en modo demo/simulación, generamos el estado desde el progreso del curso por estudiante.
  const studentHasCertForCourse = (student: any, courseId: number) => {
    const enrolled = student.enrolledCourses?.find((c: Course) => c.id === courseId);
    if (!enrolled) return false;
    return enrolled.completed || (enrolled.progress ?? 0) >= 100;
  };

  const getInitials = (n?: string) => (n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'U');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isTeacher ? 'Certificados' : 'Mis Certificados'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isTeacher
              ? 'Tus certificados y el estado por curso de tus estudiantes'
              : (certificates.length > 0
                ? `Completaste ${certificates.length} curso${certificates.length !== 1 ? 's' : ''}`
                : 'Completá cursos para obtener certificados')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Award className="w-6 h-6 text-green-600" />} bg="bg-green-100 dark:bg-green-900/30" value={certificates.length} label="Certificados propios" />
        <StatCard icon={<BookOpen className="w-6 h-6 text-blue-600" />} bg="bg-blue-100 dark:bg-blue-900/30" value={completedCourses} label="Cursos completados" />
        <StatCard icon={<TrendingUp className="w-6 h-6 text-[#ce8f88]" />} bg="bg-[#ce8f88]/20" value={`${overallProgress}%`} label="Progreso general" />
      </div>

      {/* Mis certificados */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Mis certificados</h2>
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aún no tenés certificados.</p>
              <Link to="/courses"><Button className="mt-4 bg-[#ce8f88] hover:bg-[#b87f78]">Ver mis cursos</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-40 bg-gradient-to-br from-[#8B9A7D] via-[#A5B49A] to-[#ce8f88] flex items-center justify-center">
                  <div className="text-center text-white p-4">
                    <Award className="w-14 h-14 mx-auto mb-2 opacity-90" />
                    <h3 className="text-lg font-bold">CERTIFICADO</h3>
                    <p className="text-sm opacity-80">Campus Duomo</p>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{cert.course || cert.coursename}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>{cert.dateissued || cert.issuedate}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.open(cert.downloadurl, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />Ver
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare(cert)}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Certificados por curso (solo instructores) */}
      {isTeacher && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Certificados por curso</h2>
          <div className="space-y-3">
            {courses.map(course => {
              const withCert = students.filter(s => studentHasCertForCourse(s, course.id));
              const withoutCert = students.filter(s => !studentHasCertForCourse(s, course.id));
              const isOpen = expanded === course.id;
              return (
                <Card key={course.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : course.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#ce8f88]/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#ce8f88]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{course.fullname}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{students.length} estudiantes</span>
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />{withCert.length} con certificado</span>
                        </p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Con certificado ({withCert.length})</p>
                          {withCert.length === 0 ? (
                            <p className="text-xs text-gray-400">Aún no hay estudiantes con certificado.</p>
                          ) : withCert.map(s => (
                            <StudentRow key={s.id} student={s} initials={getInitials(s.fullname)} status="ok" />
                          ))}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sin certificado ({withoutCert.length})</p>
                          {withoutCert.length === 0 ? (
                            <p className="text-xs text-gray-400">Todos los estudiantes tienen certificado.</p>
                          ) : withoutCert.map(s => (
                            <StudentRow key={s.id} student={s} initials={getInitials(s.fullname)} status="pending" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, bg, value, label }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentRow({ student, initials, status }: any) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Avatar className="h-7 w-7">
        <AvatarImage src={student.profileimageurl} alt={student.fullname} />
        <AvatarFallback className="bg-[#8B9A7D] text-white text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{student.fullname}</span>
      {status === 'ok'
        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
        : <XCircle className="w-4 h-4 text-gray-300" />}
    </div>
  );
}

export default Certificates;
