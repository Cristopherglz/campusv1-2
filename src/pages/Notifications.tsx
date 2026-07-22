// Página de Notificaciones del Campus Duomo LMS
// Construidas desde datos disponibles de la API

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  GraduationCap, 
  FileText, 
  MessageSquare, 
  Award,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { moodleApi } from '@/services/moodleApi';
import type { Notification } from '@/types';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Obtener notificaciones construidas desde datos disponibles
      const notifs = await moodleApi.getNotifications(undefined, 50);
      
      // Validación defensiva
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (id: string | number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string | number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'grade':
        return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><GraduationCap className="w-5 h-5 text-green-600" /></div>;
      case 'assignment':
        return <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>;
      case 'message':
        return <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><MessageSquare className="w-5 h-5 text-purple-600" /></div>;
      case 'achievement':
        return <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><Award className="w-5 h-5 text-amber-600" /></div>;
      default:
        return <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><Bell className="w-5 h-5 text-gray-600" /></div>;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'grade': return 'Calificación';
      case 'assignment': return 'Tarea';
      case 'message': return 'Mensaje';
      case 'achievement': return 'Logro';
      default: return 'Sistema';
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Fecha desconocida';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} d`;
    return new Date(timestamp * 1000).toLocaleDateString('es-ES');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'No tienes notificaciones pendientes'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#8B9A7D]" />
            Centro de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes notificaciones
              </h3>
              <p className="text-gray-500">
                Las notificaciones aparecerán aquí cuando haya actividad en tus cursos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                    notification.read 
                      ? 'bg-gray-50' 
                      : 'bg-[#8B9A7D]/5 border border-[#8B9A7D]/20'
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <h4 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => deleteNotification(notification.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Notifications;
