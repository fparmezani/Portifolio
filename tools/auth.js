// Cadastro único (Supabase Auth) + créditos — compartilhado por Tools e Kits.
// Uso: const { user, perfil } = await exigirCadastro({ origem: "simulador" });
// Kits: await exigirCadastro({ origem: "kit-…", contexto: "kit" });
// WhatsApp nunca bloqueia desbloqueio; opcional só no form de e-mail dos kits.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// O login fica salvo por endereço: tools.* e kits.* vão para o domínio principal.
if (location.hostname === "tools.fernandoparmezani.com.br") {
  location.replace("https://fernandoparmezani.com.br/tools" + location.pathname + location.search + location.hash);
}
if (location.hostname === "kits.fernandoparmezani.com.br") {
  const path = location.pathname === "/" ? "/" : location.pathname;
  location.replace("https://fernandoparmezani.com.br/kits" + path + location.search + location.hash);
}

const SUPABASE_URL = "https://hrpmoshviubjrudawuuk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q-B_hBYinXx4cS055Aao0Q_2aUK0OHW";
const PRIVACIDADE = new URL("privacidade.html", import.meta.url).href;
const ACEITE_KEY = "auth:aceite";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function salvarAceiteLocal({ termos, ofertas }) {
  try {
    localStorage.setItem(ACEITE_KEY, JSON.stringify({
      termos: Boolean(termos),
      ofertas: Boolean(ofertas),
      ts: Date.now(),
    }));
  } catch { /* modo privado */ }
}

function lerAceiteLocal() {
  try {
    const raw = localStorage.getItem(ACEITE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.termos) return null;
    return data;
  } catch {
    return null;
  }
}

function limparAceiteLocal() {
  try { localStorage.removeItem(ACEITE_KEY); } catch { /* modo privado */ }
}

/** Aplica aceite salvo no localStorage via RPC. Retorna true se perfil ficou com aceite. */
async function aplicarAceitePendente() {
  const pendente = lerAceiteLocal();
  if (!pendente?.termos) return false;
  const { error } = await supabase.rpc("registrar_aceite", { ofertas: Boolean(pendente.ofertas) });
  if (error) return false;
  limparAceiteLocal();
  return true;
}

function htmlAceiteChecks(ehKit) {
  const ofertasTxt = ehKit
    ? "Quero receber novos kits e materiais por e-mail. Dá para sair quando quiser."
    : "Quero receber conteúdos e ofertas do Fernando por e-mail. Opcional, e dá para sair quando quiser.";
  return `
    <div class="auth-aceite" data-aceite>
      <label class="auth-check"><input name="termos" type="checkbox" required> <span>Li e aceito a <a href="${PRIVACIDADE}" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>
      <label class="auth-check"><input name="ofertas" type="checkbox" ${ehKit ? "checked" : ""}> <span>${ofertasTxt}</span></label>
    </div>`;
}

function lerChecksAceite(raiz) {
  const box = raiz.querySelector("[data-aceite]");
  if (!box) return { termos: false, ofertas: false };
  return {
    termos: Boolean(box.querySelector('input[name="termos"]')?.checked),
    ofertas: Boolean(box.querySelector('input[name="ofertas"]')?.checked),
  };
}

const ERROS = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "User already registered": "Esse e-mail já tem conta. Use a aba Entrar.",
  "Email not confirmed": "Confirme seu e-mail pelo link que enviamos antes de entrar.",
  "Password should be at least 6 characters.": "A senha precisa ter pelo menos 8 caracteres.",
  same_password: "A nova senha precisa ser diferente da atual.",
  "New password should be different from the old password.": "A nova senha precisa ser diferente da atual.",
};
const traduzir = (erro) =>
  ERROS[erro?.code] ?? ERROS[erro?.message] ?? "Não deu certo agora. Tente de novo em instantes.";
const urlDeVolta = () => location.origin + location.pathname;
const lembrarVolta = () => {
  try {
    const path = location.hostname === "kits.fernandoparmezani.com.br"
      ? "/kits" + (location.pathname === "/" ? "/" : location.pathname)
      : location.pathname;
    localStorage.setItem("auth:voltar", path);
  } catch { /* modo privado */ }
};

export function toolsApiBase() {
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return "http://localhost:3001";
  return "https://api.fernandoparmezani.com.br";
}

export async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function lerSaldoCreditos() {
  const token = await accessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${toolsApiBase()}/me/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return Number(body.credits);
  } catch {
    return null;
  }
}

export async function lerHistoricoCreditos() {
  const token = await accessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${toolsApiBase()}/me/credits/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return Array.isArray(body.items) ? body.items : [];
  } catch {
    return [];
  }
}

export async function comprarCreditos() {
  const token = await accessToken();
  if (!token) {
    alert("Faça login para comprar créditos.");
    return;
  }
  const here = location.origin + location.pathname + location.search;
  const res = await fetch(`${toolsApiBase()}/checkout/credits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      successUrl: `${location.origin}${location.pathname}?credits=ok`,
      cancelUrl: here.includes("credits=") ? location.origin + location.pathname : here,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.url) {
    alert(body.error || "Não consegui abrir o pagamento agora.");
    return;
  }
  location.href = body.url;
}

/** Debita 1 crédito no backend. Retorna { ok, credits?, error?, code? }. */
export async function consumirCreditoFerramenta(ferramenta) {
  const token = await accessToken();
  if (!token) return { ok: false, error: "Faça login para continuar.", code: "unauthorized" };
  const path = ferramenta === "simulador" ? "/simulador/consumir" : null;
  if (!path) return { ok: false, error: "Ferramenta desconhecida." };
  try {
    const res = await fetch(`${toolsApiBase()}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 402 || body.code === "insufficient_credits") {
      return { ok: false, error: body.error, code: "insufficient_credits" };
    }
    if (!res.ok) return { ok: false, error: body.error || "Não consegui debitar o crédito agora." };
    return { ok: true, credits: Number(body.credits) };
  } catch {
    return { ok: false, error: "Não consegui falar com o servidor de créditos." };
  }
}

/** Empty-state guiado quando o saldo zera. */
export function mensagemSemCreditosHtml() {
  return `
    <div class="auth-empty-credits" role="status">
      <strong>Seus créditos acabaram</strong>
      <p>Cada Raio-X ou simulado usa 1 crédito. Compre um pacote de <strong>100 créditos</strong> para continuar.</p>
      <button type="button" class="btn btn-primary" data-comprar-creditos>Comprar créditos</button>
    </div>`;
}

export function ligarCtaCompra(raiz) {
  if (!raiz) return;
  raiz.querySelectorAll("[data-comprar-creditos]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      comprarCreditos();
    });
  });
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function primeiroNome(perfil, user) {
  const bruto =
    perfil?.nome ||
    user?.user_metadata?.nome ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email || "").split("@")[0] ||
    "Conta";
  return String(bruto).trim().split(/\s+/)[0] || "Conta";
}

function rotuloCreditos(n) {
  if (n == null || Number.isNaN(n)) return "créditos";
  const v = Number(n);
  return v === 1 ? "1 crédito" : `${v} créditos`;
}

function rotuloLedger(item) {
  const mapa = {
    bonus_cadastro: "Bônus de cadastro",
    compra_stripe: "Compra de créditos",
    uso: item.ferramenta ? `Uso · ${item.ferramenta}` : "Uso de ferramenta",
    reembolso: item.ferramenta ? `Reembolso · ${item.ferramenta}` : "Reembolso",
  };
  return mapa[item.reason] || item.reason || "Movimentação";
}

/** Aceita (11) 99999-9999, 11999999999, +55 11 99999-9999 etc. Devolve só dígitos (com 55 se vier). */
export function normalizarWhatsapp(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return "55" + digitos;
  if (digitos.length === 12 || digitos.length === 13) return digitos;
  return "";
}

function whatsappValido(valor) {
  const n = normalizarWhatsapp(valor);
  return n.length >= 12 && n.length <= 13 && n.startsWith("55");
}

/** Máscara (11) 99999-9999 enquanto digita. */
function formatarWhatsappDigitando(valor) {
  let d = String(valor || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

async function salvarWhatsapp(userId, whatsapp) {
  const limpo = normalizarWhatsapp(whatsapp);
  if (!limpo) return;
  try {
    await supabase.auth.updateUser({ data: { whatsapp: limpo } });
  } catch { /* metadata é best-effort */ }
  try {
    await supabase.from("profiles").update({ whatsapp: limpo }).eq("id", userId);
  } catch { /* coluna pode ainda não existir */ }
}

function telaCadastro(raiz, aoEntrar, { contexto = "tool" } = {}) {
  const ehKit = contexto === "kit";
  const card = el(`
    <section class="auth-card" aria-labelledby="auth-title">
      <p class="eyebrow"><span class="pulse-dot"></span> ${ehKit ? "Kit gratuito" : "10 créditos para começar"}</p>
      <h2 id="auth-title">${ehKit ? "Desbloqueie o kit" : "Crie sua conta para começar"}</h2>
      <p class="auth-sub">${ehKit
    ? "Uma conta vale para kits e ferramentas do site. Aceite a privacidade e entre — o download libera na hora."
    : "Uma conta para todas as ferramentas e kits. Você ganha <strong>10 créditos</strong> no cadastro — cada Raio-X ou simulado usa 1. Kits não consomem crédito."}</p>
      ${htmlAceiteChecks(ehKit)}
      <button type="button" class="auth-google" data-google>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Continuar com Google
      </button>
      <div class="auth-sep"><span>ou com e-mail</span></div>
      <div class="auth-tabs" role="tablist">
        <button type="button" role="tab" data-aba="criar" aria-selected="true">Criar conta</button>
        <button type="button" role="tab" data-aba="entrar" aria-selected="false">Entrar</button>
      </div>
      <form class="auth-form" data-form="criar" novalidate>
        <label>Nome<input name="nome" type="text" autocomplete="name" maxlength="80" required></label>
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        ${ehKit ? '<label>WhatsApp <span class="auth-opcional">(opcional)</span><input name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999"></label>' : ""}
        <label>Senha<input name="senha" type="password" autocomplete="new-password" minlength="8" required placeholder="mínimo 8 caracteres"></label>
        <button class="btn btn-primary" type="submit">${ehKit ? "Criar conta e desbloquear" : "Criar conta e começar"}</button>
      </form>
      <form class="auth-form" data-form="entrar" hidden novalidate>
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>
        <button class="btn btn-primary" type="submit">Entrar</button>
        <button class="auth-link" type="button" data-esqueci>Esqueci a senha</button>
      </form>
      <p class="auth-msg" role="alert"></p>
    </section>`);
  raiz.replaceChildren(card);

  const msg = card.querySelector(".auth-msg");
  const avisar = (texto, ok = false) => { msg.textContent = texto; msg.classList.toggle("is-ok", ok); };
  const ocupado = (form, sim) => form.querySelectorAll("button, input").forEach((x) => (x.disabled = sim));

  const waInput = card.querySelector('input[name="whatsapp"]');
  if (waInput) {
    waInput.addEventListener("input", () => {
      waInput.value = formatarWhatsappDigitando(waInput.value);
    });
  }

  card.querySelectorAll("[data-aba]").forEach((aba) =>
    aba.addEventListener("click", () => {
      card.querySelectorAll("[data-aba]").forEach((a) => a.setAttribute("aria-selected", String(a === aba)));
      card.querySelectorAll("[data-form]").forEach((f) => (f.hidden = f.dataset.form !== aba.dataset.aba));
      avisar("");
    }));

  card.querySelector("[data-google]").addEventListener("click", async () => {
    const aceite = lerChecksAceite(card);
    if (!aceite.termos) return avisar("Para continuar com Google, aceite a Política de Privacidade.");
    salvarAceiteLocal(aceite);
    lembrarVolta();
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: urlDeVolta() } });
    if (error) avisar(traduzir(error));
  });

  const criar = card.querySelector('[data-form="criar"]');
  criar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(criar);
    const nome = String(f.get("nome")).trim();
    const email = String(f.get("email")).trim();
    const senha = String(f.get("senha"));
    const whatsapp = String(f.get("whatsapp") || "").trim();
    const aceite = lerChecksAceite(card);
    if (!nome || !email.includes("@")) return avisar("Preencha nome e e-mail.");
    if (whatsapp && !whatsappValido(whatsapp)) return avisar("WhatsApp inválido. Use DDD, ex.: (11) 99999-9999 — ou deixe em branco.");
    if (senha.length < 8) return avisar("A senha precisa ter pelo menos 8 caracteres.");
    if (!aceite.termos) return avisar("Para criar a conta, aceite a Política de Privacidade.");
    ocupado(criar, true);
    salvarAceiteLocal(aceite);
    lembrarVolta();
    const whatsappLimpo = whatsapp ? normalizarWhatsapp(whatsapp) : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: urlDeVolta(),
        data: {
          nome,
          ...(whatsappLimpo ? { whatsapp: whatsappLimpo } : {}),
          aceite_termos: true,
          aceite_ofertas: aceite.ofertas,
          origem: raiz.dataset.origem,
        },
      },
    });
    ocupado(criar, false);
    if (error) return avisar(traduzir(error));
    if (whatsappLimpo && data.user?.id) await salvarWhatsapp(data.user.id, whatsappLimpo);
    if (data.session) return aoEntrar(data.session);
    avisar(`Pronto! Enviamos um link de confirmação para ${email}. Abra o e-mail e clique no link para começar.`, true);
  });

  const entrar = card.querySelector('[data-form="entrar"]');
  entrar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(entrar);
    ocupado(entrar, true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("senha")),
    });
    ocupado(entrar, false);
    if (error) return avisar(traduzir(error));
    aoEntrar(data.session);
  });

  card.querySelector("[data-esqueci]").addEventListener("click", async () => {
    const email = String(new FormData(entrar).get("email")).trim();
    if (!email.includes("@")) return avisar("Digite seu e-mail acima e clique de novo em Esqueci a senha.");
    lembrarVolta();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: urlDeVolta() });
    avisar(error ? traduzir(error) : `Se existir uma conta com ${email}, você vai receber um link para criar uma nova senha.`, !error);
  });
}

function telaNovaSenha(raiz, aoTerminar) {
  const card = el(`
    <section class="auth-card">
      <h2>Crie uma nova senha</h2>
      <form class="auth-form" novalidate>
        <label>Nova senha<input name="senha" type="password" autocomplete="new-password" minlength="8" required></label>
        <button class="btn btn-primary" type="submit">Salvar e continuar</button>
      </form>
      <p class="auth-msg" role="alert"></p>
    </section>`);
  raiz.replaceChildren(card);
  card.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const senha = String(new FormData(e.target).get("senha"));
    const msg = card.querySelector(".auth-msg");
    if (senha.length < 8) { msg.textContent = "A senha precisa ter pelo menos 8 caracteres."; return; }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error && error.code !== "same_password" && !/different from the old password/i.test(error.message || "")) {
      msg.textContent = traduzir(error);
      return;
    }
    aoTerminar();
  });
}

/** Fallback raro: OAuth sem localStorage (modo privado / outra aba). Sem WhatsApp. */
function telaAceite(raiz, perfil, { contexto = "tool" } = {}) {
  const ehKit = contexto === "kit";
  return new Promise((resolver) => {
    const card = el(`
      <section class="auth-card">
        <h2>Bem-vindo, <span data-nome></span></h2>
        <p class="auth-sub">Marque a privacidade para liberar${ehKit ? " o kit" : ""}.</p>
        <form class="auth-form" novalidate>
          <label class="auth-check"><input name="termos" type="checkbox" required> <span>Li e aceito a <a href="${PRIVACIDADE}" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>
          <label class="auth-check"><input name="ofertas" type="checkbox" ${ehKit ? "checked" : ""}> <span>${ehKit
    ? "Quero receber novos kits e materiais por e-mail."
    : "Quero receber conteúdos e ofertas do Fernando por e-mail. Opcional, e dá para sair quando quiser."}</span></label>
          <button class="btn btn-primary" type="submit">${ehKit ? "Desbloquear kit" : "Começar"}</button>
        </form>
        <p class="auth-msg" role="alert"></p>
      </section>`);
    card.querySelector("[data-nome]").textContent = (perfil.nome || perfil.email || "").split(" ")[0];
    raiz.replaceChildren(card);
    card.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const msg = card.querySelector(".auth-msg");
      if (!f.get("termos")) { msg.textContent = "Para continuar, aceite a Política de Privacidade."; return; }
      const { error } = await supabase.rpc("registrar_aceite", { ofertas: Boolean(f.get("ofertas")) });
      if (error) { msg.textContent = traduzir(error); return; }
      resolver();
    });
  });
}

async function lerPerfil(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

/**
 * Mostra o cadastro em `#auth-gate` até a pessoa estar logada e com o aceite registrado.
 * O conteúdo da ferramenta/kit fica em `#app` (escondido até lá).
 * Após login bem-sucedido: libera na hora (aceite via form ou localStorage pós-Google).
 * @param {{ origem: string, contexto?: "kit" | "tool" }} opts
 */
export function exigirCadastro({ origem, contexto = "tool" }) {
  const raiz = document.querySelector("#auth-gate");
  const app = document.querySelector("#app");
  raiz.dataset.origem = origem;

  const recuperando = location.hash.includes("type=recovery");

  return new Promise((resolver) => {
    let liberado = false;
    const liberar = async (session) => {
      if (liberado || !session) return;
      liberado = true;
      let perfil = await lerPerfil(session.user.id);
      if (!perfil?.aceite_termos_em) {
        const ok = await aplicarAceitePendente();
        if (ok) perfil = await lerPerfil(session.user.id);
      }
      if (perfil && !perfil.aceite_termos_em) {
        // Fallback raro: OAuth sem localStorage (modo privado / aba diferente)
        app.hidden = true;
        raiz.hidden = false;
        await telaAceite(raiz, perfil, { contexto });
        perfil = await lerPerfil(session.user.id);
      }
      raiz.hidden = true;
      app.hidden = false;
      history.replaceState(null, "", location.pathname + location.search);
      resolver({ user: session.user, perfil });
    };

    supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "PASSWORD_RECOVERY") {
        telaNovaSenha(raiz, () => liberar(session));
        return;
      }
      if (evento === "SIGNED_IN" && !recuperando) setTimeout(() => liberar(session), 0);
    });

    // Sem resposta do Supabase (fora do ar, rede): mostra aviso em vez de página em branco.
    const indisponivel = () => {
      if (liberado) return;
      app.hidden = true;
      raiz.hidden = false;
      telaIndisponivel(raiz);
    };
    const espera = setTimeout(indisponivel, 10000);

    supabase.auth.getSession().then(({ data, error }) => {
      clearTimeout(espera);
      if (!data.session && error) return indisponivel();
      if (recuperando && data.session) {
        app.hidden = true;
        raiz.hidden = false;
        return telaNovaSenha(raiz, () => liberar(data.session));
      }
      if (data.session) return liberar(data.session);
      app.hidden = true;
      raiz.hidden = false;
      telaCadastro(raiz, liberar, { contexto });
    }).catch(() => {
      clearTimeout(espera);
      indisponivel();
    });
  });
}

function telaIndisponivel(raiz) {
  const card = el(`
    <section class="auth-card" aria-labelledby="auth-title">
      <p class="eyebrow"><span class="pulse-dot"></span> Instabilidade</p>
      <h2 id="auth-title">O login está fora do ar agora</h2>
      <p class="auth-sub">Não consegui falar com o servidor de contas. Seus créditos e dados estão guardados. Tente de novo em alguns minutos.</p>
      <button type="button" class="btn btn-primary" data-recarregar>Tentar de novo</button>
    </section>`);
  card.querySelector("[data-recarregar]").addEventListener("click", () => location.reload());
  raiz.replaceChildren(card);
}

/** Atualiza o badge e o saldo detalhado no menu. */
export function atualizarSaldoBarra(credits) {
  const n = credits == null || Number.isNaN(Number(credits)) ? null : Number(credits);
  document.querySelectorAll("[data-credits]").forEach((node) => {
    node.textContent = rotuloCreditos(n);
  });
  document.querySelectorAll("[data-saldo-detalhe]").forEach((node) => {
    node.textContent = rotuloCreditos(n);
  });
}

async function abrirHistorico() {
  const overlay = el(`
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-hist-title">
      <div class="auth-modal-card">
        <div class="auth-modal-head">
          <h2 id="auth-hist-title">Histórico de créditos</h2>
          <button type="button" class="auth-modal-close" data-fechar aria-label="Fechar">×</button>
        </div>
        <div class="auth-hist-list" data-lista>
          <p class="auth-hist-empty">Carregando…</p>
        </div>
      </div>
    </div>`);
  document.body.append(overlay);
  const fechar = () => overlay.remove();
  overlay.querySelector("[data-fechar]").addEventListener("click", fechar);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fechar(); });

  const lista = overlay.querySelector("[data-lista]");
  const items = await lerHistoricoCreditos();
  if (!items.length) {
    lista.innerHTML = `<p class="auth-hist-empty">Ainda não há movimentações.</p>`;
    return;
  }
  lista.replaceChildren(...items.map((item) => {
    const delta = Number(item.delta);
    const quando = item.created_at
      ? new Date(item.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : "";
    return el(`
      <div class="auth-hist-item">
        <div>
          <strong>${rotuloLedger(item)}</strong>
          <span>${quando}</span>
        </div>
        <span class="auth-hist-delta ${delta >= 0 ? "is-plus" : "is-minus"}">${delta >= 0 ? "+" : ""}${delta}</span>
      </div>`);
  }));
}

/**
 * Menu de conta no header: botão = Nome + badge de créditos.
 * Dropdown: saldo, comprar, histórico, sair (e-mail só dentro do menu).
 */
export function barraDoUsuario(user, perfilHint = null) {
  const header = document.querySelector(".header");
  if (!header || header.querySelector(".auth-account")) return;
  // Migra conta que ficou dentro do .nav em versões antigas
  document.querySelector(".nav > .auth-account")?.remove();

  const item = el(`
    <div class="auth-account">
      <button type="button" class="auth-account-btn" aria-expanded="false" aria-haspopup="true" data-toggle>
        <span data-nome></span>
        <span data-credits class="auth-credits">…</span>
      </button>
      <div class="auth-account-menu" hidden data-menu>
        <p class="auth-account-email" data-email></p>
        <p class="auth-account-saldo">Saldo: <strong data-saldo-detalhe>…</strong></p>
        <button type="button" data-comprar>Comprar créditos</button>
        <button type="button" data-historico>Histórico</button>
        <button type="button" data-sair>Sair</button>
      </div>
    </div>`);

  item.querySelector("[data-nome]").textContent = primeiroNome(perfilHint, user);
  item.querySelector("[data-email]").textContent = user.email || "";

  const btn = item.querySelector("[data-toggle]");
  const menu = item.querySelector("[data-menu]");
  const fecharMenu = () => {
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const aberto = menu.hidden;
    menu.hidden = !aberto;
    btn.setAttribute("aria-expanded", String(aberto));
  });
  document.addEventListener("click", (e) => {
    if (!item.contains(e.target)) fecharMenu();
  });

  item.querySelector("[data-sair]").addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.reload();
  });
  item.querySelector("[data-comprar]").addEventListener("click", () => {
    fecharMenu();
    comprarCreditos();
  });
  item.querySelector("[data-historico]").addEventListener("click", () => {
    fecharMenu();
    abrirHistorico();
  });
  header.append(item);
  header.classList.add("has-auth-account");

  const params = new URLSearchParams(location.search);
  if (params.get("credits") === "ok") {
    const aviso = el(`<p class="auth-credits-toast" role="status">Pagamento confirmado. Seus créditos devem aparecer em instantes.</p>`);
    document.querySelector(".tools-main .container, .kits-main .container")?.prepend(aviso);
    params.delete("credits");
    const qs = params.toString();
    history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : ""));
    setTimeout(() => aviso.remove(), 8000);
  }

  Promise.all([lerSaldoCreditos(), perfilHint ? Promise.resolve(perfilHint) : lerPerfil(user.id)]).then(([apiSaldo, perfil]) => {
    if (perfil) item.querySelector("[data-nome]").textContent = primeiroNome(perfil, user);
    if (apiSaldo != null) {
      atualizarSaldoBarra(apiSaldo);
      return;
    }
    if (perfil && typeof perfil.credits === "number") {
      atualizarSaldoBarra(perfil.credits);
      return;
    }
    atualizarSaldoBarra(null);
  });
}

/** Guarda o uso da ferramenta para segmentar campanhas. Falha em silêncio. */
export async function registrarUso(ferramenta, evento, detalhes = {}) {
  try {
    await supabase.from("uso_ferramentas").insert({ ferramenta, evento, detalhes });
  } catch { /* uso é métrica, não pode travar a ferramenta */ }
}
