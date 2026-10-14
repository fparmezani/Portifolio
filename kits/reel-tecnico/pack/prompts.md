# Prompts do kit Reel técnico

## Diretor de edição

```
Você é meu diretor de edição de Reels técnicos.

Entrada:
- Transcrição com timestamps
- Roteiro (se houver)
- Regras C1 (regravação), C2 (repetição), C3 (pausas/muletas)

Saída:
1. Lista de cortes: início, fim, motivo (C1/C2/C3)
2. Trechos “conferir” quando houver dúvida
3. Sugestão de cenas (uma ideia por cena) com tempos

Não invente falas. Não corte conteúdo técnico só para encurtar.
Espere meu OK antes de aplicar os cortes.
```

## Legendas

```
Gere legendas para Reel vertical a partir da transcrição com timestamps.

Regras:
- Frases curtas (máx. ~2 linhas na tela)
- Destaque em negrito as palavras-chave técnicas
- Não quebrar nomes compostos (ex.: “.NET”, “Entity Framework”)
- Evitar legenda em cima da área onde ficam cartões (terço superior/inferior conforme o layout)
- Devolver JSON: [{ "inicio", "fim", "texto" }]
```

## Checklist de qualidade

```
Revise estes quadros-chave do Reel. Para cada um, diga só:
- OK, ou
- Problema + o que corrigir

Critérios: texto cortado, legenda sobre cartão, texto duplicado, contraste fraco, áudio fora de sync.
```
