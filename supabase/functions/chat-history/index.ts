import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { action, owner, id, title, messages } = await req.json();
    if (typeof owner !== "string" || owner.length < 3 || owner.length > 200) return json({ error: "Usuario inválido" }, 400);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const t = db.from("assistant_threads");

    if (action === "list") {
      const { data, error } = await t.select("id,title,updated_at").eq("owner_key", owner).order("updated_at", { ascending: false }).limit(50);
      if (error) throw error;
      return json({ items: data ?? [] });
    }
    if (action === "get") {
      const { data, error } = await t.select("id,title,messages").eq("owner_key", owner).eq("id", id).maybeSingle();
      if (error) throw error;
      return json({ thread: data });
    }
    if (action === "create") {
      const { data, error } = await t.insert({ owner_key: owner, title: String(title ?? "Nueva conversación").slice(0, 80), messages: Array.isArray(messages) ? messages.slice(-100) : [] }).select("id,title,updated_at").single();
      if (error) throw error;
      return json({ thread: data });
    }
    if (action === "save") {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (Array.isArray(messages)) patch.messages = messages.slice(-100);
      if (title) patch.title = String(title).slice(0, 80);
      const { error } = await t.update(patch).eq("owner_key", owner).eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === "delete") {
      const { error } = await t.delete().eq("owner_key", owner).eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "Acción inválida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
