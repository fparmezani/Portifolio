# Configurar créditos + Stripe

O código já está pronto. Ambiente e Stripe em **modo teste** primeiro.

## 1) Supabase — SQL

No SQL Editor, rode (se ainda não rodou):

`supabase/migrations/20261013_credits.sql`

Isso cria `profiles.credits`, `credit_ledger`, triggers de +10 no cadastro e as RPCs.

## 2) Stripe — modo TEST

1. Dashboard Stripe → toggle **Test mode**
2. Developers → API keys → copie `sk_test_…`
3. Crie produto/preço de créditos em Test (ou use o Price ID de teste)
4. Webhooks (ainda em Test) → Add endpoint  
   - URL: `https://api.fernandoparmezani.com.br/webhooks/stripe`  
   - Evento: `checkout.session.completed`  
   - Copie o **Signing secret** → `whsec_…` de teste
5. Cartão de teste: `4242 4242 4242 4242`

Só depois de validar o fluxo, troque para `sk_live_` + webhook Live + price Live.

## 3) Hostinger — variáveis do app Node (`api.fernandoparmezani.com.br`)

| Variável | Onde pegar |
|---|---|
| `SUPABASE_URL` | `https://….supabase.co` (**sem** `/rest/v1/`) |
| `SUPABASE_ANON_KEY` | Settings → API (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role — **nunca** no front |
| `STRIPE_SECRET_KEY` | `sk_test_…` (teste) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` do webhook Test |
| `STRIPE_PRICE_CREDITS` | price de Test |
| `STRIPE_CREDITS_PER_PACK` | `100` |

`hosting_nodejs_replace-environment-variables` substitui **todas** as envs — envie o set completo com valores reais (nunca `********`).

## 4) Teste rápido

1. Conta **nova** → 10 créditos (badge no botão Nome + créditos).  
2. Conta **antiga** → 0 até comprar.  
3. Simulador “Começar” → saldo −1.  
4. Raio-X com PDF → saldo −1.  
5. Saldo 0 → empty-state + Comprar → Checkout Test `4242` → `?credits=ok` → +100.  
6. Histórico no menu da conta.  
7. Login em `/tools` → `/kits` sem novo cadastro (WhatsApp só se faltar).

Health: `GET https://api.fernandoparmezani.com.br/health`  
Esperado: `"credits": true`, `"stripe": true`, `"stripe_mode": "test"`.
