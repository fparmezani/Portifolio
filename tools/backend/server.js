import express from "express";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeResume, RaioXError } from "./raio-x.js";
import {
  requireUser,
  getCredits,
  getCreditHistory,
  consumirCredito,
  reembolsarCredito,
  supabaseConfigured,
} from "./supabase.js";
import { createCreditsCheckout, handleStripeWebhook, stripeConfigured } from "./stripe-billing.js";

const app = express();
const port = process.env.PORT || 3001;
const origins = (process.env.ALLOWED_ORIGINS || "https://fernandoparmezani.com.br,https://www.fernandoparmezani.com.br")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const PER_IP_HOUR = Number(process.env.RAIO_X_PER_IP_HOUR) || 5;
const PER_DAY = Number(process.env.RAIO_X_PER_DAY) || 200;
const RAIO_X_CUSTO = 3;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origins.includes(origin) || /^https:\/\/([a-z0-9-]+\.)?fernandoparmezani\.com\.br$/.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Webhook Stripe precisa do body cru (antes do JSON parser).
async function stripeWebhookHandler(req, res) {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) return res.status(400).send("missing signature");
    const result = await handleStripeWebhook(req.body, signature);
    res.json(result);
  } catch (error) {
    console.error("stripe webhook", error && error.message);
    res.status(400).send("webhook error");
  }
}
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
// Alias legado (endpoint antigo no Dashboard Stripe).
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "200kb" }));

const hits = new Map();
let day = new Date().toISOString().slice(0, 10);
let dayCount = 0;

function allow(ip) {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
    hits.clear();
  }
  if (dayCount >= PER_DAY) return false;
  const hourAgo = Date.now() - 3600_000;
  const recent = (hits.get(ip) || []).filter((time) => time > hourAgo);
  if (recent.length >= PER_IP_HOUR) return false;
  recent.push(Date.now());
  hits.set(ip, recent);
  dayCount += 1;
  return true;
}

const MSG_SEM_CREDITO =
  "Seus créditos não são suficientes. Compre mais créditos para continuar usando as ferramentas.";

async function authOr401(req, res) {
  if (!supabaseConfigured()) {
    res.status(503).json({ error: "Créditos ainda não configurados no servidor." });
    return null;
  }
  let auth;
  try {
    auth = await requireUser(req);
  } catch (error) {
    // Sem isso, um erro aqui derruba o processo e a Hostinger responde 503.
    console.error("auth", error && error.message);
    res.status(503).json({ error: "Não consegui validar seu login agora. Tente de novo em instantes." });
    return null;
  }
  if (!auth) {
    res.status(401).json({ error: "Faça login para usar esta ferramenta." });
    return null;
  }
  return auth;
}

app.get("/health", (_req, res) => {
  const key = process.env.STRIPE_SECRET_KEY || "";
  res.json({
    status: "ok",
    service: "tools-api",
    credits: supabaseConfigured(),
    stripe: stripeConfigured(),
    stripe_mode: key.startsWith("sk_test_") ? "test" : key.startsWith("sk_live_") ? "live" : "unknown",
  });
});

app.get("/me/credits", async (req, res) => {
  const auth = await authOr401(req, res);
  if (!auth) return;
  try {
    const credits = await getCredits(auth.user.id);
    res.setHeader("Cache-Control", "no-store");
    res.json({ credits });
  } catch (error) {
    console.error("me/credits", error && error.message);
    res.status(500).json({ error: "Não consegui ler seu saldo agora." });
  }
});

app.get("/me/credits/history", async (req, res) => {
  const auth = await authOr401(req, res);
  if (!auth) return;
  try {
    const items = await getCreditHistory(auth.user.id);
    res.setHeader("Cache-Control", "no-store");
    res.json({ items });
  } catch (error) {
    console.error("me/credits/history", error && error.message);
    res.status(500).json({ error: "Não consegui ler o histórico agora." });
  }
});

app.post("/simulador/consumir", async (req, res) => {
  const auth = await authOr401(req, res);
  if (!auth) return;
  try {
    const credits = await consumirCredito(auth.token, "simulador");
    res.setHeader("Cache-Control", "no-store");
    res.json({ credits });
  } catch (error) {
    if (error && error.code === "insufficient_credits") {
      return res.status(402).json({ error: MSG_SEM_CREDITO, code: "insufficient_credits" });
    }
    console.error("simulador/consumir", error && error.message);
    res.status(500).json({ error: "Não consegui debitar o crédito agora." });
  }
});

app.post("/checkout/credits", async (req, res) => {
  const auth = await authOr401(req, res);
  if (!auth) return;
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: "Pagamentos ainda não configurados." });
  }
  try {
    const session = await createCreditsCheckout({
      userId: auth.user.id,
      email: auth.user.email,
      successUrl: req.body?.successUrl,
      cancelUrl: req.body?.cancelUrl,
    });
    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("checkout/credits", error && error.message);
    res.status(500).json({ error: "Não consegui abrir o pagamento agora." });
  }
});

// A leitura leva 1–2 min e o proxy da Hostinger corta conexões longas (~60 s).
// Por isso o POST só abre um pedido e responde na hora; o navegador consulta o GET até ficar pronto.
// Os pedidos ficam só na memória do processo e somem minutos depois de prontos (nada vai para banco).
const jobs = new Map();
const JOB_TTL_MS = 15 * 60 * 1000;

setInterval(() => {
  const limite = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.updatedAt < limite) jobs.delete(id);
  }
}, 60 * 1000).unref();

function falhaRaioX(error) {
  if (error instanceof RaioXError) return { status: error.status, error: error.message };
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 503, error: "Muitas leituras ao mesmo tempo. Tente em alguns minutos." };
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`anthropic ${error.status}`);
    return { status: 502, error: "A leitura completa falhou agora." };
  }
  console.error(error && error.name, error && error.message);
  return { status: 500, error: "A leitura completa falhou agora." };
}

async function rodarRaioX(job, body) {
  try {
    job.report = await analyzeResume(body);
    job.status = "done";
  } catch (error) {
    const falha = falhaRaioX(error);
    try {
      await reembolsarCredito(job.userId, "raio-x", RAIO_X_CUSTO);
      job.refunded = true;
    } catch (refundErr) {
      console.error("reembolso raio-x", refundErr && refundErr.message);
    }
    job.status = "error";
    job.error = falha.error;
  }
  job.updatedAt = Date.now();
}

app.post("/raio-x", async (req, res) => {
  if (!allow(req.ip)) {
    return res.status(429).json({ error: "Limite de leituras atingido. Tente de novo mais tarde." });
  }

  const auth = await authOr401(req, res);
  if (!auth) return;

  try {
    await consumirCredito(auth.token, "raio-x", RAIO_X_CUSTO);
  } catch (error) {
    if (error && error.code === "insufficient_credits") {
      return res.status(402).json({ error: MSG_SEM_CREDITO, code: "insufficient_credits" });
    }
    console.error("consumir raio-x", error && error.message);
    return res.status(500).json({ error: "Não consegui debitar o crédito agora. Nada foi cobrado." });
  }

  const job = { id: randomUUID(), userId: auth.user.id, status: "running", updatedAt: Date.now() };
  jobs.set(job.id, job);
  rodarRaioX(job, req.body);

  const credits = await getCredits(auth.user.id).catch(() => null);
  res.setHeader("Cache-Control", "no-store");
  res.status(202).json({ job: job.id, credits });
});

app.get("/raio-x/:job", async (req, res) => {
  const auth = await authOr401(req, res);
  if (!auth) return;

  res.setHeader("Cache-Control", "no-store");
  const job = jobs.get(req.params.job);
  if (!job || job.userId !== auth.user.id) {
    return res.status(404).json({ status: "missing", error: "Essa leitura não está mais no servidor." });
  }
  if (job.status === "running") return res.json({ status: "running" });

  const credits = await getCredits(auth.user.id).catch(() => null);
  if (job.status === "error") {
    return res.json({ status: "error", error: job.error, refunded: Boolean(job.refunded), credits });
  }
  res.json({ status: "done", report: job.report, credits });
});

app.listen(port, () => {
  console.log(`tools-api listening on ${port}`);
  if (!supabaseConfigured()) console.warn("credits: SUPABASE_* incompleto");
  if (!stripeConfigured()) console.warn("stripe: STRIPE_SECRET_KEY ou WEBHOOK_SECRET ausente");
});
