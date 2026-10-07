# tools/backend

API do Raio-X do Currículo (`tools/ats`). O PDF é lido no navegador. Só o texto extraído chega aqui. A API chama o Claude, responde e descarta.

Não há banco, login, log do conteúdo nem gravação de currículo.

## Rota

`POST /raio-x`

```json
{ "text": "texto extraído do PDF", "context": { "company": "", "recruiter": "", "jobDescription": "" } }
```

A resposta traz `diagnosis`, `sections` (antes → depois → por quê), `keywords`, `resume` (currículo completo reescrito) e `todo`. O formato é garantido por JSON Schema em `raio-x.js`. Números que o PDF não traz voltam como `[preencher: …]` e nunca são inventados.

Saúde: `GET /health`.

## Variáveis de ambiente

| Nome | Padrão | Para quê |
|---|---|---|
| `ANTHROPIC_API_KEY` | (obrigatória) | Chave da Anthropic. Nunca vai para o GitHub. |
| `ALLOWED_ORIGINS` | `https://fernandoparmezani.com.br,https://www.fernandoparmezani.com.br` | Origens liberadas no CORS, separadas por vírgula. |
| `RAIO_X_PER_IP_HOUR` | `5` | Leituras por IP a cada hora. |
| `RAIO_X_PER_DAY` | `200` | Teto diário total, para segurar o custo. |
| `RAIO_X_MODEL` | `claude-opus-5-5` | Modelo usado. |
| `PORT` | `3001` | Porta. |

## Publicar na Hostinger

1. No painel, crie o app Node no subdomínio `api.fernandoparmezani.com.br` apontando para esta pasta.
2. Defina as variáveis acima no painel, no mínimo `ANTHROPIC_API_KEY`.
3. Comando de start: `npm start`.
4. Se o subdomínio for outro, troque `<meta name="raio-x-api">` em `tools/ats/index.html`.

Se a API não responder, a página cai sozinha na leitura básica por regras, feita no navegador.

## Local

```bash
npm install
ANTHROPIC_API_KEY=... ALLOWED_ORIGINS=http://localhost:8080 npm start
```

Abrindo o site em `localhost`, a página chama `http://localhost:3001` automaticamente.
