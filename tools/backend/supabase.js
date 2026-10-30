import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Node < 22 não tem WebSocket nativo e o supabase-js lança erro no createClient sem isso.
const realtime = { transport: WebSocket };

const url = process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.SUPABASE_ANON_KEY || "";

export function supabaseConfigured() {
  return Boolean(url && serviceKey && anonKey);
}

export function adminClient() {
  if (!url || !serviceKey) throw new Error("SUPABASE_URL/SERVICE_ROLE_KEY missing");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime,
  });
}

export function userClient(accessToken) {
  if (!url || !anonKey) throw new Error("SUPABASE_URL/ANON_KEY missing");
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
    realtime,
  });
}

export function bearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/** Valida o JWT do Supabase e devolve o user + token. */
export async function requireUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { user: data.user, token };
}

export async function getCredits(userId) {
  const admin = adminClient();
  const { data, error } = await admin.from("profiles").select("credits").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.credits ?? 0;
}

export async function consumirCredito(token, ferramenta) {
  const client = userClient(token);
  const { data, error } = await client.rpc("consumir_credito", { p_ferramenta: ferramenta });
  if (error) {
    const msg = String(error.message || "");
    if (msg.includes("insufficient_credits")) {
      const err = new Error("insufficient_credits");
      err.code = "insufficient_credits";
      throw err;
    }
    throw error;
  }
  return Number(data);
}

export async function reembolsarCredito(token, ferramenta) {
  const client = userClient(token);
  const { data, error } = await client.rpc("reembolsar_credito", { p_ferramenta: ferramenta });
  if (error) throw error;
  return Number(data);
}

export async function adicionarCompra(userId, quantidade, stripeSessionId) {
  const admin = adminClient();
  const { data, error } = await admin.rpc("adicionar_creditos_compra", {
    p_user_id: userId,
    p_quantidade: quantidade,
    p_stripe_session_id: stripeSessionId,
  });
  if (error) throw error;
  return Number(data);
}

export async function getCreditHistory(userId, limit = 50) {
  const admin = adminClient();
  const { data, error } = await admin
    .from("credit_ledger")
    .select("id, delta, reason, ferramenta, stripe_session_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
