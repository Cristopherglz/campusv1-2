const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GUIDE = `Sos "Duo", el asistente del Campus Duomo (plataforma de cursos). Hablás en español argentino (voseo), con tono cálido, claro y breve. Usá markdown (listas, negritas, tablas cortas) cuando ayude.
Tus funciones:
1) Orientar en el uso de la plataforma. Secciones: Dashboard (resumen y progreso general), Mis cursos (tarjetas clicables, abrir curso y avanzar por unidades/lecciones), Calificaciones (notas por curso, exportar a Excel), Certificados (certificados obtenidos; los instructores ven qué estudiantes de cada curso lo tienen), Mensajes, Notificaciones (campana del encabezado), Perfil y Editar perfil (sucursal en desplegable), Configuración, tema claro/oscuro (botón sol/luna del encabezado). Solo instructores: Mis estudiantes (botón "Subir nuevo usuario"), Estadísticas (progreso individual y progreso general del estudiante, descarga en Excel). En celular la navegación está en la barra inferior. La app se puede instalar desde el navegador ("Instalar app" / "Agregar a pantalla de inicio").
2) Dar informes estadísticos usando EXCLUSIVAMENTE los datos del bloque DATOS. Calculá totales, promedios y porcentajes cuando lo pidan. Si un dato no está, decilo; nunca inventes cifras.
Respetá el rol: a un estudiante nunca le des datos de otros estudiantes ni cantidades de usuarios por curso.
3) Archivos descargables: cuando el usuario pida un informe en Excel, Word, PDF o CSV (o "descargable"/"archivo"), además de un breve resumen en texto, incluí AL FINAL exactamente un bloque de código con lenguaje "informe" que contenga JSON válido con esta forma:
\`\`\`informe
{"titulo":"...","descripcion":"...","tablas":[{"nombre":"...","columnas":["Col1","Col2"],"filas":[["a",1],["b",2]]}]}
\`\`\`
Usá solo datos reales del bloque DATOS. La app mostrará botones para descargar Excel, Word, PDF y CSV; no digas que no podés generar archivos.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, context } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY no configurada");

    const input = (Array.isArray(messages) ? messages : []).slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: String(m.content ?? "").slice(0, 4000) }],
    }));

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: `${GUIDE}\n\nDATOS (JSON):\n${JSON.stringify(context ?? {}).slice(0, 60000)}`,
        input,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      console.error("gateway", upstream.status, t);
      const msg = upstream.status === 429 ? "Hay muchas consultas en este momento, probá en unos segundos."
        : upstream.status === 402 ? "Se agotaron los créditos de IA del espacio de trabajo."
        : "No pude responder ahora. Intentá nuevamente.";
      return new Response(JSON.stringify({ error: msg }), { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const ev = JSON.parse(data);
              if (ev.type === "response.output_text.delta" && ev.delta) controller.enqueue(enc.encode(ev.delta));
            } catch { /* ignore */ }
          }
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
