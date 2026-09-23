// Asistente IA "Duo": orienta en el uso del campus y brinda informes estadísticos
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GraduationCap, Send, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };
const URL_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const pick = (c: any) => ({
  nombre: c.fullname || c.shortname, progreso: c.progress ?? null,
  completado: (c.progress ?? 0) >= 100,
});

async function buildContext(user: any, isTeacher: boolean) {
  const ctx: any = {
    usuario: { nombre: `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim(), rol: isTeacher ? 'instructor' : 'estudiante' },
    fecha: new Date().toLocaleDateString('es-AR'),
  };
  try {
    const d: any = isTeacher ? await moodleApi.getTeacherDashboard() : await moodleApi.getStudentDashboard();
    const courses = Array.isArray(d?.courses) ? d.courses : [];
    ctx.cursos = courses.map(pick);
    ctx.certificados = (d?.certificates ?? []).map((c: any) => c.name || c.coursename);
    ctx.calificaciones = (d?.grades ?? []).slice(0, 40).map((g: any) => ({ curso: g.coursename, item: g.itemname, nota: g.grade ?? g.gradeformatted }));
    ctx.resumen = d?.stats ?? undefined;
    if (isTeacher) {
      const students = await moodleApi.getAllStudents(courses).catch(() => []);
      ctx.estudiantes = students.slice(0, 80).map((s: any) => ({
        nombre: s.fullname || `${s.firstname} ${s.lastname}`,
        sucursal: s.customfields?.find((f: any) => f.shortname === 'sucursales')?.value,
        cursos: (s.enrolledCourses ?? []).map(pick),
        ultimoAcceso: s.lastaccess ? new Date(s.lastaccess * 1000).toLocaleDateString('es-AR') : null,
      }));
    }
  } catch (e) { console.warn('contexto asistente', e); }
  return ctx;
}

export function AIAssistant() {
  const { user, isTeacher } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const ctxRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setMsgs([{ role: 'assistant', content: `¡Hola, **${user.firstname}**! Soy Duo, tu asistente del campus. Puedo guiarte en cómo usar la plataforma o darte informes de ${isTeacher ? 'tus cursos y estudiantes' : 'tus cursos, progreso y calificaciones'}. ¿En qué te ayudo?` }]);
    const flag = `duo_greeted_${user.id}`;
    if (!sessionStorage.getItem(flag)) { sessionStorage.setItem(flag, '1'); setOpen(true); }
    buildContext(user, isTeacher).then((c) => (ctxRef.current = c));
  }, [user?.id, isTeacher]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: 'user' as const, content: t }];
    setMsgs([...next, { role: 'assistant', content: '' }]);
    setInput(''); setBusy(true);
    try {
      if (!ctxRef.current) ctxRef.current = await buildContext(user, isTeacher);
      const res = await fetch(URL_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ messages: next.slice(1), context: ctxRef.current }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'No pude responder ahora.');
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: acc }]);
      }
      if (!acc) setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: 'No obtuve respuesta, probá reformular la consulta.' }]);
    } catch (e: any) {
      setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: `⚠️ ${e.message}` }]);
    } finally { setBusy(false); }
  };

  const suggestions = isTeacher
    ? ['Resumen de mis estudiantes', '¿Quiénes van más atrasados?', '¿Cómo subo un nuevo usuario?']
    : ['¿Cómo voy en mis cursos?', '¿Cuántos cursos completé?', '¿Dónde veo mis certificados?'];

  if (!user) return null;
  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Abrir asistente"
          className="fixed z-50 right-4 bottom-20 lg:bottom-6 h-14 w-14 rounded-full bg-[#ce8f88] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      {open && (
        <div className="fixed z-50 inset-x-2 bottom-20 top-20 sm:inset-auto sm:right-6 sm:bottom-6 lg:bottom-6 sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] text-white">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold leading-tight">Duo</p><p className="text-xs opacity-90">Asistente del Campus Duomo</p></div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 rounded hover:bg-white/20"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('text-sm max-w-[85%] break-words',
                  m.role === 'user' ? 'bg-[#8B9A7D] text-white rounded-2xl rounded-br-sm px-3 py-2' : 'text-gray-800 dark:text-gray-100')}>
                  {m.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_table]:text-xs"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  ) : <span className="animate-pulse text-gray-500">Pensando…</span>}
                </div>
              </div>
            ))}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-[#ce8f88] text-[#ce8f88] hover:bg-[#ce8f88]/10">{s}</button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Escribí tu consulta…"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              className="flex-1 resize-none max-h-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B9A7D]" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Enviar"
              className="h-9 w-9 shrink-0 rounded-full bg-[#ce8f88] text-white flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
