import {
  exigirCadastro,
  barraDoUsuario,
  registrarUso,
  supabase,
  consumirCreditoFerramenta,
  mensagemSemCreditosHtml,
  ligarCtaCompra,
  atualizarSaldoBarra,
  lerSaldoCreditos,
} from "../auth.js?v=10";

const POR_SIMULADO = 10;
const MINUTOS_PADRAO = 8;
const MINUTOS_MIN = 3;
const MINUTOS_MAX = 30;
const LIVRO = "C# Moderno sem Medo";
const CAPITULOS = {
  1: { curto: "Valor x referência", titulo: "Como o C# guarda e movimenta dados" },
  2: { curto: "Métodos e generics", titulo: "Métodos, parâmetros, generics e funções" },
  3: { curto: "Nullable", titulo: "Null não é apenas um erro: Nullable Reference Types" },
  4: { curto: "Classes, structs e records", titulo: "Classes, structs, records e imutabilidade" },
  5: { curto: "Pattern matching e Span", titulo: "Pattern matching, Span<T> e tipos restritos à stack" },
  6: { curto: "async/await", titulo: "Task, async e await sem mágica" },
  7: { curto: "Concorrência", titulo: "Concorrência, streams assíncronos e coordenação" },
  8: { curto: "ASP.NET Core e Minimal APIs", titulo: "ASP.NET Core e Minimal APIs modernas" },
  9: { curto: "HTTP, resiliência e logging", titulo: "Comunicação HTTP, resiliência e logging" },
  10: { curto: "LINQ e performance", titulo: "LINQ, alocações, performance e projeto final" },
};
const NIVEIS = { junior: "Júnior", pleno: "Pleno", senior: "Sênior" };
const CHAVE_VISTAS = "simulador:vistas";

const $ = (s) => document.querySelector(s);
const estado = {
  userId: null,
  nivel: "pleno",
  minutos: MINUTOS_PADRAO,
  temas: new Set(Object.keys(CAPITULOS).map(Number)),
  perguntas: [],
  vistas: new Set(),
};

function formatarMmSs(totalSeg) {
  const s = Math.max(0, Math.floor(totalSeg));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function sincronizarMinutos() {
  estado.minutos = Math.min(MINUTOS_MAX, Math.max(MINUTOS_MIN, estado.minutos));
  const app = $("#app");
  if (app) app.dataset.minutos = String(estado.minutos);
  const valor = $("#tempo-valor");
  if (valor) valor.textContent = `${estado.minutos} min`;
  const menos = $("#tempo-menos");
  const mais = $("#tempo-mais");
  if (menos) menos.disabled = estado.minutos <= MINUTOS_MIN;
  if (mais) mais.disabled = estado.minutos >= MINUTOS_MAX;
}

function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Código no visual do VS Code (tema Dark+): aba com o nome do arquivo, números de linha e cores.
function criarEditor(codigo) {
  const primeira = codigo.split("\n")[0].trim();
  const arquivo = /^\/\/\s*(\S+\.cs)$/.exec(primeira)?.[1] ?? "Program.cs";
  const editor = document.createElement("div");
  editor.className = "sim-editor";
  const barra = document.createElement("div");
  barra.className = "sim-editor-bar";
  const aba = document.createElement("span");
  aba.className = "sim-editor-tab";
  aba.textContent = arquivo;
  barra.append(aba);
  const pre = document.createElement("pre");
  pre.className = "line-numbers language-csharp";
  const code = document.createElement("code");
  code.className = "language-csharp";
  code.textContent = codigo;
  pre.append(code);
  editor.append(barra, pre);
  window.Prism?.highlightElement(code);
  return editor;
}

const mostrar = (id) => {
  ["#view-setup", "#view-quiz", "#view-result"].forEach((v) => ($(v).hidden = v !== id));
  $(".sim-hero").hidden = id !== "#view-setup";
};
const subirPara = (sel) => {
  const topo = $(sel).getBoundingClientRect().top + window.scrollY - 100;
  if (window.scrollY > topo) window.scrollTo({ top: Math.max(topo, 0), behavior: "smooth" });
};

// ---------- perguntas já vistas: navegador + conta ----------
function lerVistasLocais() {
  try { return JSON.parse(localStorage.getItem(CHAVE_VISTAS) || "[]"); } catch { return []; }
}
function salvarVistasLocais() {
  try { localStorage.setItem(CHAVE_VISTAS, JSON.stringify([...estado.vistas])); } catch { /* modo privado */ }
}
async function carregarVistas() {
  lerVistasLocais().forEach((id) => estado.vistas.add(id));
  const { data } = await supabase.from("simulador_vistas").select("pergunta_id");
  (data ?? []).forEach((r) => estado.vistas.add(r.pergunta_id));
}
function marcarVista(id) {
  estado.vistas.add(id);
  salvarVistasLocais();
  supabase.from("simulador_vistas").upsert({ user_id: estado.userId, pergunta_id: id }, { onConflict: "user_id,pergunta_id", ignoreDuplicates: true }).then(() => {});
}

// ---------- sorteio: inéditas primeiro, nível escolhido primeiro ----------
function sortear() {
  const doTema = estado.perguntas.filter((p) => estado.temas.has(p.capitulo));
  const peso = (p) => (estado.vistas.has(p.id) ? 2 : 0) + (p.nivel === estado.nivel ? 0 : 1);
  const ordenadas = embaralhar(doTema).sort((a, b) => peso(a) - peso(b));
  return ordenadas.slice(0, POR_SIMULADO);
}

// ---------- tela 1 ----------
function montarSetup() {
  const temas = $("#temas");
  for (const [n, cap] of Object.entries(CAPITULOS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.cap = n;
    b.textContent = `${n} · ${cap.curto}`;
    b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => {
      const ligado = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(ligado));
      ligado ? estado.temas.add(Number(n)) : estado.temas.delete(Number(n));
    });
    temas.append(b);
  }
  $("#todos-temas").addEventListener("click", () => {
    temas.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "true"));
    Object.keys(CAPITULOS).forEach((n) => estado.temas.add(Number(n)));
  });
  document.querySelectorAll("[data-nivel]").forEach((b) =>
    b.addEventListener("click", () => {
      estado.nivel = b.dataset.nivel;
      document.querySelectorAll("[data-nivel]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    }));
  $("#tempo-mais").addEventListener("click", () => {
    estado.minutos += 1;
    sincronizarMinutos();
  });
  $("#tempo-menos").addEventListener("click", () => {
    estado.minutos -= 1;
    sincronizarMinutos();
  });
  sincronizarMinutos();
  $("#comecar").addEventListener("click", () => {
    if (!estado.temas.size) { $("#setup-erro").textContent = "Escolha pelo menos um tema."; return; }
    $("#setup-erro").textContent = "";
    iniciar();
  });
}

// ---------- tela 2 ----------
let rodada = null;
let relogio = null;

async function iniciar() {
  const btn = $("#comecar");
  const erro = $("#setup-erro");
  btn.disabled = true;
  erro.textContent = "Debitando 1 crédito…";
  const debito = await consumirCreditoFerramenta("simulador");
  if (!debito.ok) {
    btn.disabled = false;
    if (debito.code === "insufficient_credits") {
      erro.innerHTML = mensagemSemCreditosHtml({ saldo: await lerSaldoCreditos(), uso: "Cada simulado usa 1 crédito." });
      ligarCtaCompra(erro);
    } else {
      erro.textContent = debito.error || "Não deu para começar agora.";
    }
    return;
  }
  atualizarSaldoBarra(debito.credits);
  erro.textContent = "";

  const perguntas = sortear();
  const limiteSeg = estado.minutos * 60;
  rodada = { perguntas, atual: 0, respostas: [], inicio: Date.now(), minutos: estado.minutos, limiteSeg };
  clearInterval(relogio);
  const tick = () => {
    const decorrido = Math.floor((Date.now() - rodada.inicio) / 1000);
    $("#q-timer").textContent = formatarMmSs(rodada.limiteSeg - decorrido);
  };
  tick();
  relogio = setInterval(tick, 1000);
  registrarUso("simulador", "iniciou", {
    nivel: estado.nivel,
    temas: [...estado.temas],
    total: perguntas.length,
    minutos: estado.minutos,
  });
  mostrar("#view-quiz");
  renderPergunta();
  btn.disabled = false;
}

function renderPergunta() {
  const p = rodada.perguntas[rodada.atual];
  const total = rodada.perguntas.length;
  $("#q-contador").textContent = `Pergunta ${rodada.atual + 1} de ${total}`;
  $("#q-tag").textContent = `${CAPITULOS[p.capitulo].curto} · ${NIVEIS[p.nivel]}`;
  $("#q-progresso").style.width = `${(rodada.atual / total) * 100}%`;
  $("#q-texto").textContent = p.pergunta;
  const codigo = $("#q-codigo");
  codigo.hidden = !p.codigo;
  codigo.replaceChildren(...(p.codigo ? [criarEditor(p.codigo)] : []));

  const opcoes = [...embaralhar(p.alternativas), { texto: "Não sei (melhor que chutar)", naoSei: true }];
  const caixa = $("#q-opcoes");
  caixa.replaceChildren();
  const confirmar = $("#confirmar");
  confirmar.disabled = true;
  let escolhida = null;
  for (const op of opcoes) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sim-opt" + (op.naoSei ? " is-naosei" : "");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = op.texto;
    b.addEventListener("click", () => {
      escolhida = op;
      caixa.querySelectorAll(".sim-opt").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      confirmar.disabled = false;
    });
    caixa.append(b);
  }
  confirmar.textContent = rodada.atual + 1 === total ? "Ver meu resultado" : "Confirmar resposta";
  confirmar.onclick = () => {
    if (!escolhida) return;
    rodada.respostas.push({ pergunta: p, escolhida, acertou: Boolean(escolhida.correta) });
    marcarVista(p.id);
    rodada.atual += 1;
    if (rodada.atual < total) { renderPergunta(); subirPara("#view-quiz"); }
    else finalizar();
  };
}

// ---------- tela 3 ----------
function veredito(pct, nivel) {
  const n = NIVEIS[nivel];
  if (pct >= 80) return [`${n} pronto para a entrevista.`, "Você responderia com segurança a maior parte do que costuma cair."];
  if (pct >= 60) return [`Passaria, com ressalvas.`, "Você vai bem na maioria, mas os temas em amarelo podem derrubar sua nota final."];
  if (pct >= 40) return [`Ainda arriscado para ${n}.`, "Dá para chegar lá rápido estudando os temas em amarelo."];
  return ["Hora de reforçar a base.", "Sem problema: é exatamente para isso que existe simulado. Comece pelo tema com mais erros."];
}

function finalizar() {
  clearInterval(relogio);
  const { respostas } = rodada;
  const acertos = respostas.filter((r) => r.acertou).length;
  const total = respostas.length;
  const pct = Math.round((acertos / total) * 100);

  const porCap = new Map();
  for (const r of respostas) {
    const c = porCap.get(r.pergunta.capitulo) ?? { acertos: 0, total: 0 };
    c.total += 1;
    if (r.acertou) c.acertos += 1;
    porCap.set(r.pergunta.capitulo, c);
  }
  const caps = [...porCap.entries()].sort((a, b) =>
    a[1].acertos / a[1].total - b[1].acertos / b[1].total ||
    (b[1].total - b[1].acertos) - (a[1].total - a[1].acertos) ||
    a[0] - b[0]);
  const pior = caps[0];
  const temLacuna = pior && pior[1].acertos < pior[1].total;

  $("#r-anel").style.setProperty("--p", pct);
  $("#r-nota").textContent = `${acertos}/${total}`;
  const [titulo, texto] = veredito(pct, estado.nivel);
  $("#r-kicker").textContent = temLacuna ? `Lacuna principal: ${CAPITULOS[pior[0]].curto}` : "Nenhuma lacuna nesta rodada";
  $("#r-veredito").textContent = titulo;
  const minutosAlvo = rodada.minutos || estado.minutos;
  $("#r-resumo").textContent = `${texto} · ~${minutosAlvo} min`;

  const temas = $("#r-temas");
  temas.replaceChildren();
  for (const [cap, c] of [...porCap.entries()].sort((a, b) => a[0] - b[0])) {
    const linha = document.createElement("div");
    linha.className = "sim-topic" + (c.acertos / c.total < 0.6 ? " is-low" : "");
    const nome = document.createElement("span");
    nome.textContent = `${cap} · ${CAPITULOS[cap].curto}`;
    const barra = document.createElement("div");
    barra.className = "sim-bar";
    const fill = document.createElement("span");
    fill.style.width = `${(c.acertos / c.total) * 100}%`;
    barra.append(fill);
    const nota = document.createElement("b");
    nota.textContent = `${c.acertos}/${c.total}`;
    linha.append(nome, barra, nota);
    temas.append(linha);
  }

  $("#r-livro").hidden = !temLacuna;
  if (temLacuna) $("#r-livro-cap").textContent = `${LIVRO} · Cap. ${pior[0]}: ${CAPITULOS[pior[0]].titulo}`;

  const erradas = respostas.filter((r) => !r.acertou);
  $("#r-revisao-titulo").querySelector("span").textContent = String(erradas.length);
  const revisao = $("#r-revisao");
  revisao.replaceChildren();
  if (!erradas.length) {
    const ok = document.createElement("p");
    ok.className = "sim-allright";
    ok.textContent = "Você acertou tudo. Tente o nível acima ou outros temas.";
    revisao.append(ok);
  }
  for (const r of erradas) revisao.append(itemRevisao(r));

  registrarUso("simulador", "concluiu", {
    nivel: estado.nivel,
    acertos,
    total,
    por_capitulo: Object.fromEntries(porCap),
    erradas: erradas.map((r) => r.pergunta.id),
    segundos: Math.round((Date.now() - rodada.inicio) / 1000),
  });

  rodada.resumo = { acertos, total, pior: temLacuna ? CAPITULOS[pior[0]].curto : null };
  mostrar("#view-result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function itemRevisao({ pergunta: p, escolhida }) {
  const item = document.createElement("article");
  item.className = "sim-item";
  const correta = p.alternativas.find((a) => a.correta);
  const add = (tag, classe, texto) => {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    n.textContent = texto;
    item.append(n);
    return n;
  };
  add("h3", "", `${CAPITULOS[p.capitulo].curto} · ${p.pergunta}`);
  if (p.codigo) item.append(criarEditor(p.codigo));
  const linha = (rotulo, classe, texto) => {
    const par = document.createElement("p");
    const r = document.createElement("span");
    r.className = classe;
    r.textContent = rotulo + " ";
    par.append(r, document.createTextNode(texto));
    item.append(par);
  };
  if (escolhida.naoSei) linha("Você marcou:", "sim-you", "Não sei. Honesto, e na entrevista vale mais que um chute.");
  else {
    linha("Você marcou:", "sim-you", escolhida.texto);
    if (escolhida.porque) linha("Por que está errado:", "sim-you", escolhida.porque);
  }
  linha("Resposta certa:", "sim-want", correta.texto);
  linha("O entrevistador queria ouvir:", "sim-want", p.explicacao);
  add("p", "sim-cap", `Para estudar: ${LIVRO}, capítulo ${p.capitulo}.`);
  return item;
}

function montarResultado() {
  $("#refazer").addEventListener("click", () => {
    mostrar("#view-setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("#compartilhar").addEventListener("click", async () => {
    const { acertos, total, pior } = rodada.resumo;
    const texto = `Fiz o Simulador de Entrevista C# e acertei ${acertos} de ${total}${pior ? `. Meu ponto fraco: ${pior}` : ""}. Testa você também:`;
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ text: texto, url });
      else {
        await navigator.clipboard.writeText(`${texto} ${url}`);
        $("#r-share-msg").textContent = "Texto copiado. É só colar no LinkedIn ou no Instagram.";
      }
    } catch { /* cancelou */ }
  });
}

// ---------- início ----------
const { user } = await exigirCadastro({ origem: "simulador" });
barraDoUsuario(user);
estado.userId = user.id;
const resposta = await fetch("perguntas.json?v=3");
estado.perguntas = await resposta.json();
await carregarVistas();
montarSetup();
montarResultado();
mostrar("#view-setup");
