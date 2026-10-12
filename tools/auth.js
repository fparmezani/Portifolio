// Cadastro único das ferramentas (Supabase Auth).
// Uso: const { user, perfil } = await exigirCadastro({ origem: "simulador" });
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// O login fica salvo por endereço: tools.fernandoparmezani.com.br vai sempre para o endereço principal.
if (location.hostname === "tools.fernandoparmezani.com.br") {
  location.replace("https://fernandoparmezani.com.br/tools" + location.pathname + location.search + location.hash);
}

const SUPABASE_URL = "https://hrpmoshviubjrudawuuk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q-B_hBYinXx4cS055Aao0Q_2aUK0OHW";
const PRIVACIDADE = new URL("privacidade.html", import.meta.url).href;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ERROS = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "User already registered": "Esse e-mail já tem conta. Use a aba Entrar.",
  "Email not confirmed": "Confirme seu e-mail pelo link que enviamos antes de entrar.",
  "Password should be at least 6 characters.": "A senha precisa ter pelo menos 8 caracteres.",
};
const traduzir = (erro) => ERROS[erro?.message] ?? "Não deu certo agora. Tente de novo em instantes.";
const urlDeVolta = () => location.origin + location.pathname;

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function telaCadastro(raiz, aoEntrar) {
  const card = el(`
    <section class="auth-card" aria-labelledby="auth-title">
      <p class="eyebrow"><span class="pulse-dot"></span> Acesso gratuito</p>
      <h2 id="auth-title">Crie sua conta para começar</h2>
      <p class="auth-sub">Uma conta só vale para todas as ferramentas do site.</p>
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
        <label>Senha<input name="senha" type="password" autocomplete="new-password" minlength="8" required placeholder="mínimo 8 caracteres"></label>
        <label class="auth-check"><input name="termos" type="checkbox" required> <span>Li e aceito a <a href="${PRIVACIDADE}" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>
        <label class="auth-check"><input name="ofertas" type="checkbox"> <span>Quero receber conteúdos e ofertas do Fernando por e-mail. Opcional, e dá para sair quando quiser.</span></label>
        <button class="btn btn-primary" type="submit">Criar conta e começar</button>
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

  card.querySelectorAll("[data-aba]").forEach((aba) =>
    aba.addEventListener("click", () => {
      card.querySelectorAll("[data-aba]").forEach((a) => a.setAttribute("aria-selected", String(a === aba)));
      card.querySelectorAll("[data-form]").forEach((f) => (f.hidden = f.dataset.form !== aba.dataset.aba));
      avisar("");
    }));

  card.querySelector("[data-google]").addEventListener("click", async () => {
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
    if (!nome || !email.includes("@")) return avisar("Preencha nome e e-mail.");
    if (senha.length < 8) return avisar("A senha precisa ter pelo menos 8 caracteres.");
    if (!f.get("termos")) return avisar("Para criar a conta, aceite a Política de Privacidade.");
    ocupado(criar, true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: urlDeVolta(),
        data: { nome, aceite_termos: true, aceite_ofertas: Boolean(f.get("ofertas")), origem: raiz.dataset.origem },
      },
    });
    ocupado(criar, false);
    if (error) return avisar(traduzir(error));
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
    if (error) { msg.textContent = traduzir(error); return; }
    aoTerminar();
  });
}

// Quem entrou pelo Google ainda não aceitou nada: um passo só.
function telaAceite(raiz, perfil) {
  return new Promise((resolver) => {
    const card = el(`
      <section class="auth-card">
        <p class="eyebrow"><span class="pulse-dot"></span> Último passo</p>
        <h2>Bem-vindo, <span data-nome></span></h2>
        <form class="auth-form" novalidate>
          <label class="auth-check"><input name="termos" type="checkbox" required> <span>Li e aceito a <a href="${PRIVACIDADE}" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>
          <label class="auth-check"><input name="ofertas" type="checkbox"> <span>Quero receber conteúdos e ofertas do Fernando por e-mail. Opcional, e dá para sair quando quiser.</span></label>
          <button class="btn btn-primary" type="submit">Começar</button>
        </form>
        <p class="auth-msg" role="alert"></p>
      </section>`);
    card.querySelector("[data-nome]").textContent = (perfil.nome || perfil.email).split(" ")[0];
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
 * O conteúdo da ferramenta fica em `#app` (escondido até lá).
 */
export function exigirCadastro({ origem }) {
  const raiz = document.querySelector("#auth-gate");
  const app = document.querySelector("#app");
  raiz.dataset.origem = origem;

  // Link de "esqueci a senha": primeiro a nova senha, depois a ferramenta.
  const recuperando = location.hash.includes("type=recovery");

  return new Promise((resolver) => {
    let liberado = false;
    const liberar = async (session) => {
      if (liberado || !session) return;
      liberado = true;
      let perfil = await lerPerfil(session.user.id);
      if (perfil && !perfil.aceite_termos_em) {
        app.hidden = true;
        raiz.hidden = false;
        await telaAceite(raiz, perfil);
        perfil = await lerPerfil(session.user.id);
      }
      raiz.hidden = true;
      app.hidden = false;
      history.replaceState(null, "", location.pathname);
      resolver({ user: session.user, perfil });
    };

    supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "PASSWORD_RECOVERY") {
        telaNovaSenha(raiz, () => liberar(session));
        return;
      }
      if (evento === "SIGNED_IN" && !recuperando) setTimeout(() => liberar(session), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (recuperando && data.session) {
        app.hidden = true;
        raiz.hidden = false;
        return telaNovaSenha(raiz, () => liberar(data.session));
      }
      if (data.session) return liberar(data.session);
      app.hidden = true;
      raiz.hidden = false;
      telaCadastro(raiz, liberar);
    });
  });
}

/** Mostra "e-mail · Sair" no menu do site. */
export function barraDoUsuario(user) {
  const nav = document.querySelector(".nav");
  if (!nav || nav.querySelector(".auth-user")) return;
  const item = el(`<span class="auth-user"><span data-email></span> · <button type="button">Sair</button></span>`);
  item.querySelector("[data-email]").textContent = user.email;
  item.querySelector("button").addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.reload();
  });
  nav.append(item);
}

/** Guarda o uso da ferramenta para segmentar campanhas. Falha em silêncio. */
export async function registrarUso(ferramenta, evento, detalhes = {}) {
  try {
    await supabase.from("uso_ferramentas").insert({ ferramenta, evento, detalhes });
  } catch { /* uso é métrica, não pode travar a ferramenta */ }
}
