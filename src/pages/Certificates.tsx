// Página de Certificados del Campus Duomo LMS
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Share2, CheckCircle2, ExternalLink, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { moodleApi } from '@/services/moodleApi';
import type { Certificate, Course } from '@/types';

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [certs, coursesData] = await Promise.all([
        moodleApi.getUserCertificates(),
        moodleApi.getUserCourses(),
      ]);
      setCertificates(Array.isArray(certs) ? certs : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error al cargar certificados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.completed || (c.progress ?? 0) >= 100).length;
  const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  const handleDownload = (cert: Certificate) => window.open(cert.downloadurl, '_blank');

  const handleShare = async (cert: Certificate) => {
    const shareUrl = cert.downloadurl || '';
    if (navigator.share) {
      try {
        await navigator.share({ title: `Certificado: ${cert.course}`, text: `Completé el curso "${cert.course}" en Campus Duomo`, url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado al portapapeles');
    }
  };

  if (isLoading) return <CertificatesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Certificados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {certificates.length > 0
              ? `Completaste ${certificates.length} curso${certificates.length !== 1 ? 's' : ''}`
              : 'Completá cursos para obtener certificados'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{certificates.length}</p>
              <p className="text-sm text-gray-500">Certificados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{completedCourses}</p>
              <p className="text-sm text-gray-500">Cursos completados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ce8f88]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#ce8f88]" />
            </div>
            <div>
              <p className="text-3xl font-bold">{overallProgress}%</p>
              <p className="text-sm text-gray-500">Progreso general</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aún no tenés certificados</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Completá tus cursos para obtener certificados que acrediten tu formación.
            </p>
            <Link to="/courses">
              <Button className="bg-[#ce8f88] hover:bg-[#b87f78]">
                <BookOpen className="w-4 h-4 mr-2" />
                Ver mis cursos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-[#8B9A7D] via-[#A5B49A] to-[#ce8f88] flex items-center justify-center">
                <div className="relative z-10 text-center text-white p-6">
                  <Award className="w-16 h-16 mx-auto mb-3 opacity-90" />
                  <h3 className="text-lg font-bold">CERTIFICADO</h3>
                  <p className="text-sm opacity-80">Campus Duomo</p>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Completado
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                  {cert.course || cert.coursename}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Completado el {cert.dateissued || cert.issuedate}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleDownload(cert)}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Ver
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
  );
}

function CertificatesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => <Card key={i}><Skeleton className="h-48 w-full" /><CardContent className="p-5"><Skeleton className="h-6 w-full mb-2" /><Skeleton className="h-10 w-full" /></CardContent></Card>)}
      </div>
    </div>
  );
}

export default Certificates;
