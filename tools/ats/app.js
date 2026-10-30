import {
  exigirCadastro,
  barraDoUsuario,
  accessToken,
  atualizarSaldoBarra,
  mensagemSemCreditosHtml,
  ligarCtaCompra,
  comprarCreditos,
} from "../auth.js?v=9";

const CHECKOUT = "https://pay.cakto.com.br/dv7g5sp_1090093";
const SCAN_MS = 2800;
const GATE_MS = 4000;
const API_TIMEOUT_MS = 180000;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PAGES = 15;

const $ = (id) => document.getElementById(id);
const RaioXAnalyze = window.RaioXAnalyze;
const pdfjsLib = window.pdfjsLib;

const views = {
  upload: $("view-upload"),
  scan: $("view-scan"),
  result: $("view-result")
};

let gateTimer = 0;
let scanTimer = 0;
let run = 0;
let pending = null;

function apiBase() {
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return "http://localhost:3001";
  const meta = document.querySelector('meta[name="raio-x-api"]');
  return meta ? meta.content.replace(/\/+$/, "") : "";
}

const DOTNET_CLOSE = {
  title: "O currículo abre a porta. A entrevista cobra o porquê.",
  body: "Na call, a pergunta é record, await, valor e referência. O C# Moderno Sem Medo são 10 capítulos nesse caminho, com laboratório e mais de 100 perguntas de revisão. R$ 27,90, PDF na hora, 7 dias para devolver."
};

const OTHER_CLOSE = {
  title: "O currículo abre a porta. A entrevista cobra o porquê.",
  body: "Este PDF não destacou C# ou .NET. Se a sua stack é .NET, o C# Moderno Sem Medo são 10 capítulos para explicar o porquê do código, com laboratório e mais de 100 perguntas de revisão. R$ 27,90, PDF na hora, 7 dias para devolver."
};

// Uma folha só, usada na tela, no PDF e no Word.
const RESUME_CSS = `
.resume-sheet{width:min(794px,100%);margin:0 auto;padding:56px 60px;background:#fff;color:#1f2937;font:400 10.5pt/1.5 Inter,"Segoe UI",Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.35);outline:none}
.resume-sheet *{box-sizing:border-box}
.cv-name{margin:0;color:#0b1b33;font:800 25pt/1.1 Inter,"Segoe UI",Arial,sans-serif;letter-spacing:-.02em}
.cv-headline{margin:6px 0 0;color:#0b4fb3;font-weight:600;font-size:12pt}
.cv-contact{margin:10px 0 0;padding-bottom:14px;border-bottom:2px solid #0b1b33;color:#475569;font-size:9.5pt}
.cv-contact span+span::before{content:"  ·  ";color:#94a3b8;white-space:pre}
.cv-section{margin-top:18px}
.cv-section h2{margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #cbd5e1;color:#0b4fb3;font:700 9.5pt/1.2 Inter,"Segoe UI",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}
.cv-section p{margin:0 0 6px}
.cv-job{margin-top:12px;break-inside:avoid;page-break-inside:avoid}
.cv-job:first-of-type{margin-top:4px}
.cv-row{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.cv-row strong{color:#0b1b33;font-size:11pt}
.cv-date{flex:none;color:#475569;font-size:9.5pt;white-space:nowrap}
.cv-sub{margin:1px 0 4px;color:#475569;font-size:9.5pt}
.cv-context{margin:0 0 4px;color:#64748b;font-style:italic;font-size:9.5pt}
.cv-job ul,.cv-list{margin:4px 0 0;padding-left:18px}
.cv-job li,.cv-list li{margin:2px 0}
.cv-skills p{margin:0 0 3px}
.cv-skills b{color:#0b1b33}
.cv-todo{background:#fef08a;color:#713f12;border-radius:3px;padding:0 2px}
@media print{.cv-todo{background:none;color:inherit}}
`;

function injectResumeCss() {
  const style = document.createElement("style");
  style.textContent = RESUME_CSS;
  document.head.appendChild(style);
}

function armScan() {
  const line = document.querySelector(".scan-line");
  if (!line) return;
  line.style.animation = "none";
  void line.offsetWidth;
  line.style.animation = "raio-sweep 2.4s ease-in-out infinite alternate";
}

function show(name) {
  for (const [key, node] of Object.entries(views)) node.hidden = key !== name;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// Escapa e pinta os marcadores [preencher: …].
function rich(value) {
  return esc(value).replace(/\[preencher:[^\]]*\]/gi, (match) => `<mark class="cv-todo">${match}</mark>`);
}

function list(value) {
  return Array.isArray(value) ? value.filter((item) => item != null && item !== "") : [];
}

const ICON = {
  ok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  bad: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  warn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16h.01"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>`
};

const VERDICT = {
  ok: { tone: "ok", label: "Está bom" },
  ajustar: { tone: "warn", label: "Ajustar" },
  reescrever: { tone: "bad", label: "Reescrever" },
  ausente: { tone: "bad", label: "Falta no currículo" }
};

/* ---------- Leitura completa ---------- */

function renderVerdict(report, context) {
  const diagnosis = report.diagnosis || {};
  const score = Math.max(0, Math.min(100, Number(diagnosis.score) || 0));
  $("score-value").textContent = String(score);
  $("score-ring").style.setProperty("--p", String(score));
  $("vacancy-tag").textContent = context.jobDescription || context.company ? " · com a vaga informada" : "";
  $("verdict-headline").textContent = diagnosis.headline || "";
  $("verdict-summary").textContent = diagnosis.summary || "";
  $("strength-list").innerHTML = list(diagnosis.strengths).map((item) => `<li>${esc(item)}</li>`).join("")
    || "<li>Nada se destacou ainda.</li>";
  $("risk-list").innerHTML = list(diagnosis.risks).map((item) => `<li>${esc(item)}</li>`).join("")
    || "<li>Nenhum bloqueio grave.</li>";

  const keywords = report.keywords || {};
  const present = list(keywords.present);
  const missing = list(keywords.missing);
  $("kw-row").innerHTML = [
    present.length ? `<div><h3>Palavras-chave que o ATS encontra</h3><p>${present.map((item) => `<span class="chip is-ok">${esc(item)}</span>`).join("")}</p></div>` : "",
    missing.length ? `<div><h3>Palavras-chave que faltam</h3><p>${missing.map((item) => `<span class="chip is-bad">${esc(item)}</span>`).join("")}</p></div>` : ""
  ].join("");
}

function renderSections(sections) {
  $("section-list").innerHTML = list(sections).map((section) => {
    const verdict = VERDICT[section.verdict] || VERDICT.ajustar;
    const changes = list(section.changes).map((change) => `
      <div class="change">
        ${change.before ? `<div class="change-before"><span>Hoje</span><p>${esc(change.before)}</p></div>` : ""}
        <div class="change-after">
          <span>${change.before ? "Troque por" : "Acrescente"}</span>
          <p>${rich(change.after)}</p>
          <button type="button" class="copy-btn" data-copy="${esc(change.after)}">${ICON.copy}<b>Copiar</b></button>
        </div>
        ${change.why ? `<p class="change-why">${esc(change.why)}</p>` : ""}
      </div>`).join("");
    return `<article class="rx-block is-${verdict.tone} is-wide">
      <header class="rx-head">
        <span class="rx-mark">${ICON[verdict.tone]}</span>
        <div>
          <p class="rx-state">${verdict.label}</p>
          <h2>${esc(section.name)}</h2>
        </div>
      </header>
      <p class="rx-summary">${esc(section.diagnosis)}</p>
      ${changes ? `<div class="change-list">${changes}</div>` : ""}
    </article>`;
  }).join("");
}

function period(start, end) {
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

function section(title, body) {
  return body ? `<section class="cv-section"><h2>${title}</h2>${body}</section>` : "";
}

function resumeHtml(resume) {
  const contact = resume.contact || {};
  const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website]
    .filter(Boolean)
    .map((item) => `<span>${rich(item)}</span>`)
    .join("");

  const experience = list(resume.experience).map((job) => {
    const sub = [job.company, job.location].filter(Boolean).map(rich).join(" · ");
    const bullets = list(job.bullets).map((item) => `<li>${rich(item)}</li>`).join("");
    return `<div class="cv-job">
      <div class="cv-row"><strong>${rich(job.role)}</strong><span class="cv-date">${rich(period(job.start, job.end))}</span></div>
      ${sub ? `<p class="cv-sub">${sub}</p>` : ""}
      ${job.context ? `<p class="cv-context">${rich(job.context)}</p>` : ""}
      ${bullets ? `<ul>${bullets}</ul>` : ""}
    </div>`;
  }).join("");

  const skills = list(resume.skills)
    .filter((group) => list(group.items).length)
    .map((group) => `<p>${group.group ? `<b>${rich(group.group)}:</b> ` : ""}${list(group.items).map(rich).join(", ")}</p>`)
    .join("");

  const education = list(resume.education).map((item) => `<div class="cv-job">
      <div class="cv-row"><strong>${rich(item.course)}</strong><span class="cv-date">${rich(period(item.start, item.end))}</span></div>
      <p class="cv-sub">${[item.institution, item.status].filter(Boolean).map(rich).join(" · ")}</p>
    </div>`).join("");

  const certs = list(resume.certifications)
    .map((item) => `<li>${rich(item.name)}${item.issuer ? ` — ${rich(item.issuer)}` : ""}${item.year ? ` (${rich(item.year)})` : ""}</li>`)
    .join("");

  const languages = list(resume.languages)
    .map((item) => `${rich(item.language)}${item.level ? `: ${rich(item.level)}` : ""}`)
    .join("  ·  ");

  const projects = list(resume.projects)
    .map((item) => `<li><b>${rich(item.name)}</b>${item.description ? ` — ${rich(item.description)}` : ""}${item.link ? ` (${rich(item.link)})` : ""}</li>`)
    .join("");

  return `
    <h1 class="cv-name">${rich(resume.name || "[preencher: seu nome]")}</h1>
    ${resume.headline ? `<p class="cv-headline">${rich(resume.headline)}</p>` : ""}
    ${contactLine ? `<p class="cv-contact">${contactLine}</p>` : ""}
    ${section("Objetivo", resume.objective ? `<p>${rich(resume.objective)}</p>` : "")}
    ${section("Resumo profissional", resume.summary ? `<p>${rich(resume.summary)}</p>` : "")}
    ${section("Experiência profissional", experience)}
    ${section("Competências técnicas", skills ? `<div class="cv-skills">${skills}</div>` : "")}
    ${section("Formação acadêmica", education)}
    ${section("Certificações e cursos", certs ? `<ul class="cv-list">${certs}</ul>` : "")}
    ${section("Idiomas", languages ? `<p>${languages}</p>` : "")}
    ${section("Projetos", projects ? `<ul class="cv-list">${projects}</ul>` : "")}
  `;
}

function countTodo() {
  const marks = $("resume-sheet").textContent.match(/\[preencher:[^\]]*\]/gi) || [];
  const count = marks.length;
  $("todo-count").textContent = count
    ? `${count} trecho(s) para completar`
    : "Tudo preenchido";
  $("todo-count").classList.toggle("is-done", count === 0);
  return count;
}

function renderResume(report) {
  $("resume-sheet").innerHTML = resumeHtml(report.resume || {});
  const todo = list(report.todo);
  $("todo-box").hidden = !todo.length;
  $("todo-list").innerHTML = todo.map((item) => `<li>${esc(item)}</li>`).join("");
  countTodo();
}

function renderFull(report, context) {
  $("full-result").hidden = false;
  $("lite-result").hidden = true;
  renderVerdict(report, context);
  renderSections(report.sections);
  renderResume(report);
}

/* ---------- Leitura básica (reserva, sem API) ---------- */

function blockTone(block) {
  if (!block.present) return "bad";
  const jobBad = (block.jobs || []).some((job) => /não há|não aparece|quase só|não achei/i.test(job.detail || ""));
  return (block.notes || []).length || jobBad ? "warn" : "ok";
}

function renderLite(local, reason) {
  $("full-result").hidden = true;
  $("lite-result").hidden = false;
  $("lite-reason").textContent = `${reason} Abaixo vai a leitura por regras, feita no navegador. Ela aponta problemas, mas não reescreve o currículo. Tente de novo em alguns minutos para receber a versão reescrita.`;
  $("lite-score").textContent = String(local.score);
  $("lite-ring").style.setProperty("--p", String(local.score));
  $("rank-list").innerHTML = (local.ranks || []).map((rank) => (
    `<li class="rank-line"><strong>${esc(rank.label)}</strong><b>${rank.score}/100</b></li>`
  )).join("");
  $("block-list").innerHTML = (local.blocks || []).map((block) => {
    const tone = blockTone(block);
    const label = { ok: "Certo", bad: "Errado", warn: "Incompleto" }[tone];
    const notes = (block.notes || []).map((note) => `<li class="is-bad">${esc(note)}</li>`).join("");
    const jobs = (block.jobs || []).map((job) => `<article class="rx-job">
        <strong>${esc(job.title)}</strong>
        ${job.excerpt ? `<q>${esc(job.excerpt)}</q>` : ""}
        <span>${esc(job.detail || "")}</span>
      </article>`).join("");
    return `<article class="rx-block is-${tone}${(block.jobs || []).length ? " is-wide" : ""}">
      <header class="rx-head">
        <span class="rx-mark">${ICON[tone]}</span>
        <div><p class="rx-state">${label}</p><h2>${esc(block.label)}</h2></div>
      </header>
      <p class="rx-summary">${esc(block.summary || "")}</p>
      ${block.excerpt ? `<blockquote class="rx-quote">${esc(block.excerpt)}</blockquote>` : ""}
      ${notes ? `<ul class="rx-notes">${notes}</ul>` : ""}
      ${jobs ? `<div class="rx-jobs">${jobs}</div>` : ""}
    </article>`;
  }).join("");
}

/* ---------- Fluxo ---------- */

function renderResult(state) {
  $("file-chip").textContent = state.full
    ? `${state.fileName} · lido e descartado · não salvo`
    : `${state.fileName} · analisado no navegador · não salvo`;
  if (state.full) renderFull(state.full, state.context);
  else renderLite(state.local, state.reason);
  const close = state.local.dotnetPitch ? DOTNET_CLOSE : OTHER_CLOSE;
  $("close-title").textContent = close.title;
  $("close-body").textContent = close.body;
  $("close-link").href = CHECKOUT;
  show("result");
  window.scrollTo({ top: 0 });
}

async function requestFull(texts, context) {
  const base = apiBase();
  if (!base) throw new Error("A leitura completa não está configurada.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    // A espera também cobre o token: se o Supabase travar aqui, o timeout ainda vence.
    const token = await Promise.race([
      accessToken(),
      new Promise((_, reject) => controller.signal.addEventListener("abort", () => reject(new DOMException("timeout", "AbortError"))))
    ]);
    if (!token) {
      const err = new Error("Faça login para usar a leitura completa.");
      err.code = "unauthorized";
      throw err;
    }
    const response = await fetch(`${base}/raio-x`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: texts.join("\n\n"), context }),
      signal: controller.signal
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 402 || body.code === "insufficient_credits") {
      const err = new Error(body.error || "Seus créditos acabaram.");
      err.code = "insufficient_credits";
      throw err;
    }
    if (!response.ok) throw new Error(body.error || "A leitura completa falhou agora.");
    if (!body || !body.resume || !body.diagnosis) throw new Error("A leitura completa veio incompleta.");
    if (body.credits != null) atualizarSaldoBarra(body.credits);
    return body;
  } catch (error) {
    if (error.code === "insufficient_credits" || error.code === "unauthorized") throw error;
    if (error.name === "AbortError") throw new Error("A leitura completa demorou demais.");
    if (error instanceof TypeError) throw new Error("Não consegui falar com o servidor da leitura completa.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function openGate(state) {
  pending = state;
  const video = $("gate-video");
  const cover = $("gate-cover");
  const button = $("see-result");
  video.hidden = true;
  cover.hidden = false;
  video.onloadeddata = () => {
    video.hidden = false;
    cover.hidden = true;
  };
  video.onerror = () => {
    video.hidden = true;
    cover.hidden = false;
  };
  video.src = "assets/apresentacao.mp4";
  button.disabled = true;
  $("gate").hidden = false;
  const started = Date.now();
  clearInterval(gateTimer);
  const tick = () => {
    const left = Math.ceil((GATE_MS - (Date.now() - started)) / 1000);
    const elapsed = Math.round((Date.now() - started) / 1000);
    if (!state.done) {
      button.textContent = "Analisando…";
      $("gate-status").textContent = elapsed < 50
        ? `Reescrevendo o seu currículo. Leva cerca de um minuto. (${elapsed}s)`
        : `Quase lá. Currículos longos levam um pouco mais. (${elapsed}s)`;
      return;
    }
    $("gate-status").textContent = state.full
      ? "Pronto. A análise e o currículo reescrito estão prontos."
      : "A leitura completa não respondeu. A leitura básica está pronta.";
    if (left > 0) {
      button.textContent = `Ver meu raio-x (${left})`;
      return;
    }
    button.disabled = false;
    button.textContent = "Ver meu raio-x";
    clearInterval(gateTimer);
  };
  tick();
  gateTimer = setInterval(tick, 250);
}

function reset() {
  run += 1;
  clearInterval(gateTimer);
  clearInterval(scanTimer);
  pending = null;
  $("file").value = "";
  $("upload-error").textContent = "";
  $("gate").hidden = true;
  const video = $("gate-video");
  video.removeAttribute("src");
  video.load();
  show("upload");
}

async function readPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageCount = pdf.numPages;
  const limit = Math.min(pageCount, MAX_PAGES);
  const texts = [];
  let images = 0;
  let columns = false;
  const ops = pdfjsLib.OPS;

  for (let number = 1; number <= limit; number += 1) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    texts.push(pageText(content.items));
    if (!columns && RaioXAnalyze.looksLikeColumns(content.items)) columns = true;
    const opList = await page.getOperatorList();
    for (const fn of opList.fnArray) {
      if (fn === ops.paintImageXObject || fn === ops.paintJpegXObject || fn === ops.paintInlineImageXObject || fn === ops.paintImageXObjectRepeat) {
        images += 1;
      }
    }
    if (number === 1) {
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = $("page-canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      armScan();
    }
  }

  return {
    texts,
    meta: { pages: pageCount, images, columns, truncated: pageCount > MAX_PAGES }
  };
}

// Mantém as quebras de linha do PDF: o modelo separa cargo, empresa e data por elas.
function pageText(items) {
  let out = "";
  for (const item of items) {
    out += item.str;
    out += item.hasEOL ? "\n" : (item.str && !/\s$/.test(item.str) ? " " : "");
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

async function start(file) {
  $("upload-error").textContent = "";
  const name = file.name.toLowerCase();
  if (file.type !== "application/pdf" && !name.endsWith(".pdf")) {
    $("upload-error").textContent = "Envie um arquivo .pdf.";
    return;
  }
  if (file.size > MAX_BYTES) {
    $("upload-error").textContent = "O PDF passa de 8 MB. Envie um arquivo menor.";
    return;
  }

  const current = ++run;
  show("scan");
  const status = $("scan-status");
  status.textContent = "Lendo o texto selecionável…";
  clearInterval(scanTimer);
  const marks = [
    [900, "Separando seções, cargos e datas…"],
    [1800, "Checando contato, palavras-chave e formato…"]
  ];
  const started = Date.now();
  scanTimer = setInterval(() => {
    const elapsed = Date.now() - started;
    const next = [...marks].reverse().find((item) => elapsed >= item[0]);
    if (next) status.textContent = next[1];
  }, 200);
  armScan();

  const context = {
    company: $("company").value.trim(),
    recruiter: $("recruiter").value.trim(),
    jobDescription: $("job-description").value.trim()
  };

  let parsed;
  try {
    parsed = await readPdf(file);
  } catch (error) {
    clearInterval(scanTimer);
    console.error(error);
    show("upload");
    $("upload-error").textContent = "Não consegui ler este PDF. Se ele tiver senha, tire a senha e tente de novo.";
    return;
  }

  const local = RaioXAnalyze.analyze(parsed.texts, parsed.meta, context);
  const fullRequest = local.found.selectable
    ? requestFull(parsed.texts, context)
    : Promise.reject(new Error("O PDF quase não tem texto selecionável, então a reescrita não tem de onde partir."));

  const wait = SCAN_MS - (Date.now() - started);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  clearInterval(scanTimer);
  if (current !== run) return;

  const state = { fileName: file.name, context, local, full: null, reason: "", done: false };
  openGate(state);
  try {
    state.full = await fullRequest;
  } catch (error) {
    if (error.code === "insufficient_credits") {
      $("gate").hidden = true;
      $("gate-video").pause();
      show("upload");
      const box = $("upload-error");
      box.innerHTML = mensagemSemCreditosHtml();
      ligarCtaCompra(box);
      return;
    }
    state.reason = error.message;
  }
  if (current !== run) return;
  state.done = true;
}

/* ---------- Exportação ---------- */

function resumeDocument() {
  const sheet = $("resume-sheet").cloneNode(true);
  sheet.removeAttribute("contenteditable");
  sheet.removeAttribute("id");
  const nameNode = sheet.querySelector(".cv-name");
  const title = nameNode ? `Currículo - ${nameNode.textContent.trim()}` : "Currículo";
  return {
    title,
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${RESUME_CSS}
@page{size:A4;margin:14mm 14mm}
html,body{margin:0;background:#fff}
.resume-sheet{width:auto;padding:0;box-shadow:none}
</style></head><body>${sheet.outerHTML}</body></html>`
  };
}

function confirmTodo() {
  const count = countTodo();
  if (!count) return true;
  return window.confirm(`Ainda há ${count} trecho(s) marcados com [preencher]. Clique neles no currículo para completar. Exportar assim mesmo?`);
}

function exportPdf() {
  if (!confirmTodo()) return;
  const doc = resumeDocument();
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const previous = document.title;
  frame.onload = () => {
    const win = frame.contentWindow;
    const fire = () => {
      document.title = doc.title;
      win.focus();
      win.print();
      setTimeout(() => {
        document.title = previous;
        frame.remove();
      }, 1000);
    };
    if (win.document.fonts && win.document.fonts.ready) win.document.fonts.ready.then(fire);
    else fire();
  };
  frame.srcdoc = doc.html;
}

function exportDoc() {
  if (!confirmTodo()) return;
  const doc = resumeDocument();
  const blob = new Blob(["﻿", doc.html], { type: "application/msword" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${doc.title.replace(/[\\/:*?"<>|]+/g, "").trim()}.doc`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
}

/* ---------- Eventos ---------- */

injectResumeCss();

if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const { user } = await exigirCadastro({ origem: "ats" });
barraDoUsuario(user);

$("context-form").addEventListener("submit", (event) => event.preventDefault());

const input = $("file");
const dropzone = $("dropzone");

input.addEventListener("change", () => {
  const file = input.files && input.files[0];
  if (file) start(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-over");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-over"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-over");
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) start(file);
});

$("see-result").addEventListener("click", () => {
  if (!pending || !pending.done || $("see-result").disabled) return;
  $("gate").hidden = true;
  $("gate-video").pause();
  renderResult(pending);
  pending = null;
});

$("again").addEventListener("click", reset);
$("export-pdf").addEventListener("click", exportPdf);
$("export-doc").addEventListener("click", exportDoc);
$("resume-sheet").addEventListener("input", countTodo);

$("section-list").addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-btn");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.querySelector("b").textContent = "Copiado";
  } catch {
    button.querySelector("b").textContent = "Selecione e copie";
  }
  setTimeout(() => { button.querySelector("b").textContent = "Copiar"; }, 1800);
});

window.RaioXApp = { renderResult, reset, resumeHtml, comprarCreditos };
