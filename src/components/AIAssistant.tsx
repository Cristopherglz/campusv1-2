// Asistente IA "Duo": orienta en el uso del campus, brinda informes y guarda historial
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GraduationCap, Send, X, MessageCircle, History, Plus, Trash2, ArrowLeft, FileSpreadsheet, FileText, FileDown, File } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { cn } from '@/lib/utils';
import { extractReport, toExcel, toWord, toPDF, toCSV, type Report } from '@/lib/reportExport';

type Msg = { role: 'user' | 'assistant'; content: string };
type ThreadMeta = { id: string; title: string; updated_at: string };
const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const HEADERS = { 'Content-Type': 'application/json', apikey: KEY };

async function history(body: Record<string, unknown>) {
  const r = await fetch(`${BASE}/chat-history`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Error de historial');
  return j;
}

const pick = (c: any) => ({ nombre: c.fullname || c.shortname, progreso: c.progress ?? null, completado: (c.progress ?? 0) >= 100 });

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

function ReportButtons({ report }: { report: Report }) {
  const btn = 'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#8B9A7D] text-[#6B7A5D] dark:text-[#b7c4a9] hover:bg-[#8B9A7D]/10';
  return (
    <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
      <p className="flex items-center gap-1 text-xs font-medium mb-1.5"><FileDown className="w-3.5 h-3.5" />{report.titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        <button className={btn} onClick={() => toExcel(report)}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</button>
        <button className={btn} onClick={() => toWord(report)}><FileText className="w-3.5 h-3.5" />Word</button>
        <button className={btn} onClick={() => toPDF(report)}><FileDown className="w-3.5 h-3.5" />PDF</button>
        <button className={btn} onClick={() => toCSV(report)}><File className="w-3.5 h-3.5" />CSV</button>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const { user, isTeacher } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadMeta[]>([]);
  const [showList, setShowList] = useState(false);
  const ctxRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const owner = user ? `moodle:${(user as any).username ?? ''}:${user.id}` : '';

  const greeting = useCallback((): Msg => ({ role: 'assistant', content: `¡Hola, **${user?.firstname}**! Soy Duo, tu asistente del campus. Puedo guiarte en cómo usar la plataforma o darte informes de ${isTeacher ? 'tus cursos y estudiantes' : 'tus cursos, progreso y calificaciones'} (también descargables en Excel, Word, PDF o CSV). ¿En qué te ayudo?` }), [user?.firstname, isTeacher]);

  const loadThreads = useCallback(async () => {
    if (!owner) return;
    try { const j = await history({ action: 'list', owner }); setThreads(j.items ?? []); } catch (e) { console.warn(e); }
  }, [owner]);

  useEffect(() => {
    if (!user) return;
    setMsgs([greeting()]); setThreadId(null);
    const flag = `duo_greeted_${user.id}`;
    if (!sessionStorage.getItem(flag)) { sessionStorage.setItem(flag, '1'); setOpen(true); }
    buildContext(user, isTeacher).then((c) => (ctxRef.current = c));
    loadThreads();
  }, [user?.id, isTeacher]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);
  useEffect(() => { if (open && !showList && !busy) taRef.current?.focus(); }, [open, showList, busy, threadId]);

  const newChat = () => { setMsgs([greeting()]); setThreadId(null); setShowList(false); };
  const openThread = async (id: string) => {
    try {
      const j = await history({ action: 'get', owner, id });
      const m = Array.isArray(j.thread?.messages) ? j.thread.messages : [];
      setMsgs([greeting(), ...m]); setThreadId(id); setShowList(false);
    } catch (e: any) { alert(e.message); }
  };
  const removeThread = async (id: string) => {
    if (!confirm('¿Eliminar esta conversación?')) return;
    try {
      await history({ action: 'delete', owner, id });
      setThreads((t) => t.filter((x) => x.id !== id));
      if (id === threadId) newChat();
    } catch (e: any) { alert(e.message); }
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: 'user' as const, content: t }];
    setMsgs([...next, { role: 'assistant', content: '' }]);
    setInput(''); setBusy(true);
    let acc = '';
    try {
      if (!ctxRef.current) ctxRef.current = await buildContext(user, isTeacher);
      const res = await fetch(`${BASE}/assistant`, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ messages: next.slice(1), context: ctxRef.current }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'No pude responder ahora.');
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: acc }]);
      }
      if (!acc) { acc = 'No obtuve respuesta, probá reformular la consulta.'; setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: acc }]); }
      // Guardado automático
      const toSave = [...next.slice(1), { role: 'assistant', content: acc }];
      try {
        if (threadId) await history({ action: 'save', owner, id: threadId, messages: toSave });
        else {
          const j = await history({ action: 'create', owner, title: t.slice(0, 60), messages: toSave });
          setThreadId(j.thread.id);
        }
        loadThreads();
      } catch (e) { console.warn('No se pudo guardar el historial', e); }
    } catch (e: any) {
      setMsgs((m) => [...m.slice(0, -1), { role: 'assistant', content: `⚠️ ${e.message}` }]);
    } finally { setBusy(false); }
  };

  const suggestions = isTeacher
    ? ['Resumen de mis estudiantes', 'Informe en Excel del progreso de estudiantes', '¿Cómo subo un nuevo usuario?']
    : ['¿Cómo voy en mis cursos?', 'Informe descargable de mis cursos', '¿Dónde veo mis certificados?'];

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
        <div className="fixed z-50 inset-x-2 bottom-20 top-20 sm:inset-auto sm:right-6 sm:bottom-6 lg:bottom-6 sm:w-[420px] sm:h-[620px] sm:max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-3 bg-gradient-to-r from-[#8B9A7D] to-[#6B7A5D] text-white">
            {showList
              ? <button onClick={() => setShowList(false)} aria-label="Volver" className="p-1 rounded hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></button>
              : <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>}
            <div className="flex-1 min-w-0"><p className="font-semibold leading-tight">{showList ? 'Conversaciones' : 'Duo'}</p><p className="text-xs opacity-90 truncate">{showList ? 'Historial guardado' : 'Asistente del Campus Duomo'}</p></div>
            <button onClick={newChat} aria-label="Nueva conversación" title="Nueva conversación" className="p-1.5 rounded hover:bg-white/20"><Plus className="w-5 h-5" /></button>
            <button onClick={() => { setShowList((s) => !s); loadThreads(); }} aria-label="Historial" title="Historial" className="p-1.5 rounded hover:bg-white/20"><History className="w-5 h-5" /></button>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1.5 rounded hover:bg-white/20"><X className="w-5 h-5" /></button>
          </div>

          {showList ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <button onClick={newChat} className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-xl bg-[#ce8f88] text-white"><Plus className="w-4 h-4" />Nueva conversación</button>
              {threads.length === 0 && <p className="text-sm text-gray-500 text-center pt-6">Todavía no hay conversaciones guardadas.</p>}
              {threads.map((th) => (
                <div key={th.id} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2', th.id === threadId ? 'border-[#8B9A7D] bg-[#8B9A7D]/10' : 'border-gray-200 dark:border-gray-700')}>
                  <button onClick={() => openThread(th.id)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{th.title}</p>
                    <p className="text-xs text-gray-500">{new Date(th.updated_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </button>
                  <button onClick={() => removeThread(th.id)} aria-label="Eliminar conversación" title="Eliminar" className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgs.map((m, i) => {
                  const { clean, report, pending } = m.role === 'assistant' ? extractReport(m.content) : { clean: m.content, report: null, pending: false };
                  return (
                    <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn('text-sm max-w-[88%] break-words',
                        m.role === 'user' ? 'bg-[#8B9A7D] text-white rounded-2xl rounded-br-sm px-3 py-2' : 'text-gray-800 dark:text-gray-100')}>
                        {m.content ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_table]:text-xs"><ReactMarkdown>{clean}</ReactMarkdown></div>
                        ) : <span className="animate-pulse text-gray-500">Pensando…</span>}
                        {pending && <span className="animate-pulse text-xs text-gray-500">Preparando archivo…</span>}
                        {report && <ReportButtons report={report} />}
                      </div>
                    </div>
                  );
                })}
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
                <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Escribí tu consulta…"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  className="flex-1 resize-none max-h-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B9A7D]" />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Enviar"
                  className="h-9 w-9 shrink-0 rounded-full bg-[#ce8f88] text-white flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
