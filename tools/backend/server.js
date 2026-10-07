import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeResume, RaioXError } from "./raio-x.js";

const app = express();
const port = process.env.PORT || 3001;
const origins = (process.env.ALLOWED_ORIGINS || "https://fernandoparmezani.com.br,https://www.fernandoparmezani.com.br")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const PER_IP_HOUR = Number(process.env.RAIO_X_PER_IP_HOUR) || 5;
const PER_DAY = Number(process.env.RAIO_X_PER_DAY) || 200;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origins.includes(origin) || /^https:\/\/([a-z0-9-]+\.)?fernandoparmezani\.com\.br$/.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "200kb" }));

// Limite em memória. Guarda só IP e horário, nunca o currículo.
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "tools-api" });
});

app.post("/raio-x", async (req, res) => {
  if (!allow(req.ip)) {
    return res.status(429).json({ error: "Limite de leituras atingido. Tente de novo mais tarde." });
  }
  try {
    const report = await analyzeResume(req.body);
    res.setHeader("Cache-Control", "no-store");
    res.json(report);
  } catch (error) {
    if (error instanceof RaioXError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(503).json({ error: "Muitas leituras ao mesmo tempo. Tente em alguns minutos." });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`anthropic ${error.status}`);
      return res.status(502).json({ error: "A leitura completa falhou agora." });
    }
    console.error(error && error.name);
    res.status(500).json({ error: "A leitura completa falhou agora." });
  }
});

app.listen(port, () => {
  console.log(`tools-api listening on ${port}`);
});
