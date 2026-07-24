// Página de Mensajes simplificada del Campus Duomo LMS
// Lista de mensajes recibidos; al clicar se abre el detalle.

import { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Clock, ChevronRight, Mail, Bell,
  AlertCircle, CheckCircle2, User, GraduationCap, FileText, Award, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { Loader } from '@/components/Loader';

interface Message {
  id: string;
  type: 'message' | 'notification' | 'alert' | 'grade' | 'assignment' | 'achievement';
  title: string;
  content: string;
  sender?: string;
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const loaded: Message[] = [];
      const now = Math.floor(Date.now() / 1000);
      try {
        const notifs = await moodleApi.getNotifications(user?.id, 50);
        if (Array.isArray(notifs)) {
          notifs.forEach((n: any) => loaded.push({
            id: `n-${n.id}`,
            type: n.type || 'notification',
            title: n.title || 'Notificación',
            content: n.message || '',
            sender: 'Sistema',
            timestamp: n.timestamp || now,
            read: n.read || false,
            link: n.link,
          }));
        }
      } catch {}
      loaded.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(loaded);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTs = (ts: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - ts;
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
    return new Date(ts * 1000).toLocaleDateString('es-AR');
  };

  const icon = (t: string) => {
    const map: any = {
      message: <MessageSquare className="w-5 h-5 text-blue-500" />,
      notification: <Bell className="w-5 h-5 text-green-500" />,
      alert: <AlertCircle className="w-5 h-5 text-amber-500" />,
      grade: <GraduationCap className="w-5 h-5 text-purple-500" />,
      assignment: <FileText className="w-5 h-5 text-blue-500" />,
      achievement: <Award className="w-5 h-5 text-amber-500" />,
    };
    return map[t] || <Mail className="w-5 h-5 text-gray-500" />;
  };

  const markRead = (id: string) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  const markAll = () => setMessages(prev => prev.map(m => ({ ...m, read: true })));

  const filtered = messages.filter(m =>
    !searchQuery ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unread = messages.filter(m => !m.read).length;

  if (isLoading) return <div className="py-20"><Loader label="Cargando mensajes..." /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mensajes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unread > 0 ? `Tenés ${unread} mensaje${unread !== 1 ? 's' : ''} sin leer` : 'No hay mensajes sin leer'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>Marcar todos como leídos</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar mensajes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay mensajes</h3>
              <p className="text-gray-500">Los mensajes que recibas aparecerán acá.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMessage(m); markRead(m.id); }}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!m.read ? 'bg-[#ce8f88]/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      {icon(m.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium truncate ${!m.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{m.title}</h4>
                        {!m.read && <span className="w-2 h-2 bg-[#ce8f88] rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{m.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{m.sender}</span>
                        {m.courseName && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{m.courseName}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTs(m.timestamp)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 self-center" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedMessage(null)}>
          <Card className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Badge variant="secondary">{selectedMessage.sender}</Badge>
              <button onClick={() => setSelectedMessage(null)} className="text-sm text-gray-500">Cerrar</button>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">{selectedMessage.title}</h3>
              <p className="text-sm text-gray-500">{formatTs(selectedMessage.timestamp)}</p>
              <p className="text-gray-700 dark:text-gray-300">{selectedMessage.content}</p>
              {selectedMessage.courseName && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4" />{selectedMessage.courseName}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Messages;
