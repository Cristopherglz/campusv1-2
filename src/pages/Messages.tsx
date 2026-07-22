// Página de Mensajes del Campus Duomo LMS - Centro de mensajes interno
// Usa datos reales de la API de Moodle

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Clock,
  ChevronRight,
  Mail,
  Bell,
  AlertCircle,
  CheckCircle2,
  User,
  Send,
  GraduationCap,
  FileText,
  Award,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// Avatar imports not used in this component
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';

interface Message {
  id: string;
  type: 'message' | 'notification' | 'alert' | 'grade' | 'assignment' | 'achievement';
  title: string;
  content: string;
  sender?: string;
  senderAvatar?: string;
  timestamp: number;
  read: boolean;
  courseName?: string;
  link?: string;
}

export function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      
      const loadedMessages: Message[] = [];
      const now = Math.floor(Date.now() / 1000);

      // 1. Obtener notificaciones del sistema (tareas, calificaciones, logros)
      try {
        const notifications = await moodleApi.getNotifications(user?.id, 50);
        if (Array.isArray(notifications)) {
          notifications.forEach((notif: any) => {
            loadedMessages.push({
              id: `notif-${notif.id}`,
              type: notif.type || 'notification',
              title: notif.title || 'Notificación',
              content: notif.message || '',
              sender: 'Sistema',
              timestamp: notif.timestamp || now,
              read: notif.read || false,
              link: notif.link,
            });
          });
        }
      } catch (error) {
        console.warn('Error al cargar notificaciones:', error);
      }

      // 2. Obtener tareas próximas (assignments)
      try {
        const assignments = await moodleApi.getAssignments();
        if (Array.isArray(assignments)) {
          assignments.forEach((course: any) => {
            if (Array.isArray(course.assignments)) {
              course.assignments.forEach((assignment: any) => {
                if (assignment.duedate && assignment.duedate > now) {
                  const daysUntil = Math.floor((assignment.duedate - now) / 86400);
                  if (daysUntil <= 14) { // Mostrar tareas que vencen en los próximos 14 días
                    loadedMessages.push({
                      id: `assignment-${assignment.id}`,
                      type: 'assignment',
                      title: 'Tarea próxima a vencer',
                      content: `"${assignment.name}" vence en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
                      sender: course.fullname || 'Sistema',
                      timestamp: now,
                      read: false,
                      courseName: course.fullname,
                      link: `/courses/${course.id}`,
                    });
                  }
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn('Error al cargar tareas:', error);
      }

      // 3. Obtener calificaciones recientes
      try {
        const grades = await moodleApi.getAllUserGrades(user?.id);
        if (Array.isArray(grades)) {
          grades
            .filter((g: any) => g.dategraded && g.dategraded > now - 30 * 86400) // Últimos 30 días
            .forEach((grade: any) => {
              loadedMessages.push({
                id: `grade-${grade.itemid}`,
                type: 'grade',
                title: 'Nueva calificación',
                content: `Has recibido ${grade.grade?.toFixed(1) || '-'} en "${grade.itemname}"`,
                sender: grade.coursename || 'Sistema',
                timestamp: grade.dategraded || now,
                read: false,
                courseName: grade.coursename,
                link: '/grades',
              });
            });
        }
      } catch (error) {
        console.warn('Error al cargar calificaciones:', error);
      }

      // 4. Obtener cursos completados recientemente
      try {
        const courses = await moodleApi.getUserCourses(user?.id);
        if (Array.isArray(courses)) {
          for (const course of courses) {
            if (course.completed) {
              try {
                const completion = await moodleApi.getCourseCompletionStatus(course.id, user?.id);
                if (completion?.timecompleted && completion.timecompleted > now - 30 * 86400) {
                  loadedMessages.push({
                    id: `completion-${course.id}`,
                    type: 'achievement',
                    title: '¡Curso completado!',
                    content: `Has completado "${course.fullname}". ¡Felicitaciones!`,
                    sender: 'Sistema',
                    timestamp: completion.timecompleted,
                    read: false,
                    courseName: course.fullname,
                    link: '/certificates',
                  });
                }
              } catch (e) {
                // Ignorar errores de completación
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error al cargar cursos completados:', error);
      }

      // Ordenar por fecha (más recientes primero)
      loadedMessages.sort((a, b) => b.timestamp - a.timestamp);
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
    return new Date(timestamp * 1000).toLocaleDateString('es-ES');
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'notification':
        return <Bell className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'grade':
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-amber-500" />;
      default:
        return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageBg = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-50 border-blue-100';
      case 'notification':
        return 'bg-green-50 border-green-100';
      case 'alert':
        return 'bg-amber-50 border-amber-100';
      case 'grade':
        return 'bg-purple-50 border-purple-100';
      case 'assignment':
        return 'bg-blue-50 border-blue-100';
      case 'achievement':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  // Filtrar mensajes
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'unread' && !message.read) ||
      (selectedTab === 'messages' && message.type === 'message') ||
      (selectedTab === 'notifications' && (message.type === 'notification' || message.type === 'grade' || message.type === 'assignment' || message.type === 'achievement')) ||
      (selectedTab === 'alerts' && message.type === 'alert');
    
    return matchesSearch && matchesTab;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, read: true } : m
    ));
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

  if (isLoading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-600 mt-1">
            Centro de mensajes y notificaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
          <Badge variant="secondary" className="text-sm">
            {unreadCount} sin leer
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de mensajes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros y búsqueda */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar mensajes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="unread">
                Sin leer
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages">Mensajes</TabsTrigger>
              <TabsTrigger value="notifications">Notif.</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay mensajes
                      </h3>
                      <p className="text-gray-500">
                        {searchQuery 
                          ? 'No se encontraron mensajes que coincidan con tu búsqueda'
                          : 'Tu bandeja de entrada está vacía. Las notificaciones aparecerán aquí cuando haya actividad en tus cursos.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => {
                            setSelectedMessage(message);
                            markAsRead(message.id);
                          }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !message.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getMessageBg(message.type)}`}>
                              {getMessageIcon(message.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium truncate ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {message.title}
                                </h4>
                                {!message.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {message.sender}
                                </span>
                                {message.courseName && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {message.courseName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Detalle o resumen */}
        <div className="space-y-4">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedMessage(null)}
                  >
                    ← Volver
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getMessageBg(selectedMessage.type)}`}>
                  {getMessageIcon(selectedMessage.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMessage.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    De: {selectedMessage.sender}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimestamp(selectedMessage.timestamp)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedMessage.content}</p>
                </div>
                {selectedMessage.courseName && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Curso: {selectedMessage.courseName}
                  </div>
                )}
                {selectedMessage.link && (
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = selectedMessage.link!}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Ver detalle
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumen */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">Mensajes</span>
                    </div>
                    <Badge variant="secondary">
                      {messages.filter(m => m.type === 'message').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Notificaciones</span>
                    </div>
                    <Badge variant="secondary">
                      {messages.filter(m => ['notification', 'grade', 'assignment', 'achievement'].includes(m.type)).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm">Alertas</span>
                    </div>
                    <Badge variant="secondary">
                      {messages.filter(m => m.type === 'alert').length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Aquí encontrarás todos tus mensajes, notificaciones del sistema y alertas importantes sobre tus cursos.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Card>
            <CardContent className="p-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full mt-2" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default Messages;
