import { createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "./supabase.js";

// Link "sair da lista" assinado: sem login, mas ninguém descadastra outra pessoa trocando o id.
const BASE = process.env.PUBLIC_API_URL || "https://api.fernandoparmezani.com.br";

function segredo() {
  const s = process.env.EMAIL_UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!s) throw new Error("EMAIL_UNSUB_SECRET/SUPABASE_SERVICE_ROLE_KEY missing");
  return s;
}

function assinar(userId) {
  return createHmac("sha256", segredo()).update(`sair:${userId}`).digest("base64url");
}

/** Link para colocar no rodapé de todo e-mail de conteúdo ou oferta. */
export function linkDescadastro(userId) {
  return `${BASE}/email/sair?u=${encodeURIComponent(userId)}&t=${assinar(userId)}`;
}

export function assinaturaValida(userId, token) {
  if (!userId || !token) return false;
  const esperado = Buffer.from(assinar(userId));
  const recebido = Buffer.from(String(token));
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export async function descadastrar(userId) {
  const { error } = await adminClient()
    .from("profiles")
    .update({ aceite_ofertas: false, aceite_ofertas_em: null })
    .eq("id", userId);
  if (error) throw error;
}

export function paginaDescadastro(ok) {
  const titulo = ok ? "Pronto, você saiu da lista" : "Link inválido";
  const texto = ok
    ? "Você não vai mais receber conteúdos e ofertas por e-mail. Sua conta e seus créditos continuam iguais. E-mails de conta, como confirmação e troca de senha, continuam chegando."
    : "Não consegui confirmar este link. Escreva para fparmezani@gmail.com que eu tiro você da lista.";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo}</title>
<style>body{margin:0;background:#020814;color:#eaf2ff;font:16px/1.6 Arial,Helvetica,sans-serif;display:grid;place-items:center;min-height:100vh;padding:16px}
main{max-width:480px;background:#0b1a33;border:1px solid rgba(93,152,255,.25);border-radius:14px;padding:28px}h1{margin:0 0 12px;font-size:22px}a{color:#4fd2ff}</style></head>
<body><main><h1>${titulo}</h1><p>${texto}</p><p><a href="https://fernandoparmezani.com.br/tools/">Voltar para as ferramentas</a></p></main></body></html>`;
}
