# tools/backend

API das ferramentas: Raio-X do Currículo (Claude), consumo de créditos e Stripe Checkout.

O PDF é lido no navegador. Só o texto extraído chega aqui. A API autentica o usuário (JWT Supabase), debita 3 créditos, chama o Claude, responde e descarta o texto.

## Rotas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | — | Saúde + flags `credits` / `stripe` |
| GET | `/me/credits` | Bearer | Saldo atual |
| POST | `/raio-x` | Bearer | Análise completa (−3 créditos; reembolsa se a IA falhar) |
| POST | `/simulador/consumir` | Bearer | Debita 1 crédito do simulado |
| POST | `/checkout/credits` | Bearer | Cria Stripe Checkout Session (100 créditos) |
| POST | `/webhooks/stripe` | assinatura Stripe | Credita após `checkout.session.completed` |

### `POST /raio-x`

```json
{ "text": "texto extraído do PDF", "context": { "company": "", "recruiter": "", "jobDescription": "" } }
```

Header: `Authorization: Bearer <access_token do Supabase>`.

Resposta 402 se não houver créditos. Em sucesso, inclui `credits` com o saldo restante.

## Variáveis de ambiente

Veja [`.env.example`](.env.example) e o passo a passo em [`CONFIGURAR-CREDITOS.md`](CONFIGURAR-CREDITOS.md).

| Nome | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (Raio-X) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Auth + créditos |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Checkout + webhook |
| `STRIPE_PRICE_CREDITS` | `price_1UQFwf9MowzYQLdMxF4tdtg9` |
| `ALLOWED_ORIGINS` | CORS |
| `RAIO_X_PER_USER_HOUR` / `RAIO_X_PER_DAY` | Teto extra de proteção |
| `PORT` | Padrão 3001 |

## Publicar na Hostinger

1. App Node em `api.fernandoparmezani.com.br` apontando para esta pasta.
2. `npm install` + variáveis do `.env.example`.
3. Start: `npm start`.
4. Rodar a migration `supabase/migrations/20261013_credits.sql` e depois `20261029_credit_amount.sql`.
5. Criar webhook Stripe → `/webhooks/stripe`.

## Local

```bash
npm install
# defina as envs (ou use um .env carregado pelo seu processo)
npm start
```

Abrindo o site em `localhost`, o front chama `http://localhost:3001`.
