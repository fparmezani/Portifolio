import Stripe from "stripe";
import { adicionarCompra } from "./supabase.js";

const CREDITS_PER_PACK = Number(process.env.STRIPE_CREDITS_PER_PACK) || 100;
const PRICE_ID = process.env.STRIPE_PRICE_CREDITS || "price_1UQFwf9MowzYQLdMxF4tdtg9";
const DEFAULT_SUCCESS = process.env.STRIPE_SUCCESS_URL || "https://fernandoparmezani.com.br/tools/?credits=ok";
const DEFAULT_CANCEL = process.env.STRIPE_CANCEL_URL || "https://fernandoparmezani.com.br/tools/?credits=cancel";

let stripe;

function client() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

function safeUrl(value, fallback) {
  try {
    const u = new URL(String(value || ""));
    if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
    if (!/(^|\.)fernandoparmezani\.com\.br$/.test(u.hostname) && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return fallback;
    }
    return u.toString();
  } catch {
    return fallback;
  }
}

export async function createCreditsCheckout({ userId, email, successUrl, cancelUrl }) {
  const session = await client().checkout.sessions.create({
    mode: "payment",
    customer_email: email || undefined,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: safeUrl(successUrl, DEFAULT_SUCCESS),
    cancel_url: safeUrl(cancelUrl, DEFAULT_CANCEL),
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      credits: String(CREDITS_PER_PACK),
    },
  });
  return session;
}

export async function handleStripeWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  const event = client().webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const credits = Number(session.metadata?.credits) || CREDITS_PER_PACK;
    if (!userId) {
      console.error("stripe checkout sem user_id", session.id);
      return { ok: false, reason: "missing_user" };
    }
    if (session.payment_status && session.payment_status !== "paid") {
      return { ok: true, skipped: true };
    }
    const saldo = await adicionarCompra(userId, credits, session.id);
    return { ok: true, credits: saldo };
  }

  return { ok: true, ignored: event.type };
}
