# Roteiro VSL: C# Moderno Sem Medo

_Recuperado da conversa de 30/09/2026 no Claude Code._

---
# PARTE A: Roteiro de fala
 Antes do roteiro, um aviso importante: comparando o PDF com a página de vendas, **a página promete coisas que o ebook não entrega.** Com a VSL isso piora, porque ela leva mais gente para a mesma promessa.

| A página diz | O ebook tem |
|---|---|
| "As perguntas que mais caem em entrevista" com "resposta modelo" pronta | 10 capítulos de **C# moderno** com teoria, laboratórios e cerca de 100 **perguntas de revisão**. Não há respostas prontas de entrevista. |
| Blocos de **EF Core**, **Testes e Git**, **Live coding e comportamental** | Esses capítulos **não existem** no PDF. |
| "Para quem busca a **1ª vaga**" | O próprio livro diz que é para **dev .NET experiente** que parou em versões antigas do C#. |

Quem compra por uma coisa e recebe outra pede reembolso dentro dos 7 dias. Se isso acontecer muito, o Meta pode reprovar os anúncios por página enganosa.

**Mais uma:** a capa **dentro do PDF** está escrita **"MORDERNO"**. A imagem da página de vendas está certa, mas o arquivo que o cliente baixa está com o erro.

Por isso escrevi a VSL com base no que **o ebook realmente tem**. O gancho de entrevista continua, mas de forma verdadeira.

---

# VSL "C# Moderno Sem Medo": cerca de 2min30

*Fala em primeira pessoa, no seu tom: direto, de dev para dev. [TELA] indica o que aparece na tela.*

---

### 1. GANCHO (0:00–0:15)
**[TELA]** O código abaixo, grande, fundo escuro, estilo editor:
```csharp
Console.WriteLine("1");
Task tarefa = ExemploAsync();   // imprime "A", espera, imprime "B"
Console.WriteLine("2");
await tarefa;
Console.WriteLine("3");
```
> Olha esse código. Pensa rápido: em que ordem ele imprime?
>
> Se você hesitou, fica tranquilo. É exatamente esse tipo de pergunta que derruba dev bom em entrevista técnica.

---

### 2. IDENTIFICAÇÃO (0:15–0:40)
**[TELA]** Você falando para a câmera.
> Você usa C# no dia a dia. Entrega, resolve, funciona.
>
> Mas aí aparece um `record`, um `string?`, um `Span`, um `ValueTask`... e bate aquela dúvida. Na entrevista é pior: o entrevistador pede para você **explicar o porquê**, e a resposta não sai.
>
> Não é falta de experiência. É que o C# mudou muito nos últimos anos, e ninguém parou para te mostrar o que mudou e por quê.

---

### 3. A VIRADA (0:40–1:05)
**[TELA]** Texto: **"Não é decorar. É entender o modelo mental."**
> Eu sou o Fernando Parmezani. Trabalho com .NET há mais de 18 anos, hoje como dev sênior e tech lead.
>
> E o que eu aprendi é isto: quem vai bem em entrevista não é quem decorou resposta. É quem consegue **olhar para o código e prever o que ele faz** antes de rodar.
>
> Foi com esse método que eu escrevi o **C# Moderno Sem Medo**.

---

### 4. O QUE TEM DENTRO (1:05–1:40)
**[TELA]** O sumário aparecendo item a item, com páginas do PDF passando ao fundo.
> São 10 capítulos, do básico ao profissional:
>
> Como o C# guarda dados na memória: valor, referência, stack e heap.
> Nullable, records, pattern matching e Span, sem susto.
> Task, async e await sem mágica, incluindo cancelamento e concorrência.
> ASP.NET Core com Minimal APIs, cliente HTTP resiliente e logging.
> E LINQ com performance, fechando com um projeto final.
>
> Todo capítulo segue o mesmo caminho: explicação simples, **"preveja antes de executar"**, erros comuns, laboratório prático e **perguntas de revisão**. São mais de 100 perguntas no livro todo, do tipo que aparece em entrevista.
>
> E no final ainda tem glossário, um mapa para decidir entre class, struct e record, e uma folha de consulta de async/await.

---

### 5. PROVA SOCIAL (1:40–1:55)
**[TELA]** Trechos curtos dos vídeos do Leandro e do Jeferson, com nome e cargo.
> Não é só eu que estou dizendo. Olha o que falaram devs que já leram.

*(Use aqui 5 a 8 segundos da melhor frase de cada vídeo.)*

---

### 6. OFERTA E GARANTIA (1:55–2:20)
**[TELA]** Capa do ebook, **R$ 27,90** grande e o selo **7 dias de garantia**.
> O C# Moderno Sem Medo sai por **R$ 27,90**. Pagamento único, em PDF, com acesso na hora, no celular ou no computador.
>
> E você tem **7 dias de garantia**. Leu e achou que não é para você? É só pedir, que eu devolvo 100% do valor.

---

### 7. CHAMADA PARA AÇÃO (2:20–2:30)
**[TELA]** Seta apontando para baixo: **"CLIQUE NO BOTÃO ABAIXO"**.
> Clica no botão aqui embaixo e começa hoje.
>
> Ah, a ordem daquele código do começo? **1, A, 2, B, 3.** Se você quer entender o porquê de verdade, está no capítulo 6.

---

## Dicas de gravação
- **Grave falando para a câmera** nas partes 2, 3, 6 e 7. Para produto de dev, o rosto do autor passa mais confiança do que uma locução de IA.
- **Não troque "prever e explicar" por "passar na entrevista".** Assim você fica protegido na política do Meta e no Código de Defesa do Consumidor.
- **Legenda queimada no vídeo inteiro**, porque a maioria assiste sem som.
- **Retomar a resposta no final (parte 7)** faz a pessoa assistir até o fim para descobrir se acertou.

## O que eu sugiro fazer antes de rodar a VSL
1. **Corrigir a capa do PDF** ("MORDERNO" → "MODERNO").
2. **Ajustar a página de vendas** ao conteúdo real: trocar os "8 blocos" pelos 10 capítulos verdadeiros e o "Para quem é" pelo público real. O gancho de entrevista pode ficar, com o mesmo enquadramento honesto desta VSL.

Quer que eu reescreva essas seções da página agora, alinhadas com o ebook e com a VSL?

---
# PARTE B: Roteiro de edição (Higgsfield)
 Abaixo está o roteiro de edição completo, pronto para enviar ao Higgsfield. As instruções estão em **inglês**, que as ferramentas de IA entendem melhor. **Os textos que aparecem na tela ficaram em português**, exatamente como devem sair no vídeo.

## Antes de enviar: nomeie e anexe os arquivos
**Os seus vídeos (um por parte):**
```
parte-1-gancho.mp4
parte-2-identificacao.mp4
parte-3-virada.mp4
parte-4-conteudo.mp4
parte-5-prova-social.mp4   (se você gravou uma introdução falando)
parte-6-oferta.mp4
parte-7-cta.mp4
```
**Materiais de apoio** (estão no projeto, em `sales/csharp-sem-medo/assets/`):
- `img/ebook4.png`: capa do livro
- `video/depoimento-leandro-oliveira.mp4`
- `video/depoimento-jeferson-santos.mp4`
- *(opcional)* prints de 3 ou 4 páginas do PDF, como o sumário e uma página de código, para usar ao fundo na parte 4

---

## Roteiro de edição para colar no Higgsfield

```
PROJECT: VSL "C# Moderno Sem Medo" — sales video for a C# ebook
LANGUAGE: Brazilian Portuguese (all on-screen text and captions in PT-BR, exactly as written below)
FORMAT: Deliver two versions: 9:16 vertical (1080x1920) and 16:9 horizontal (1920x1080). 30fps. Target length ~2:30.
INPUT: 7 talking-head clips named parte-1 ... parte-7, plus assets: ebook cover PNG, two testimonial videos, optional PDF page screenshots.

GLOBAL STYLE
- Visual identity: dark navy background (#030716), electric blue (#1D7DFC) and cyan (#4FD2FF) accents, white text.
- Fonts: headlines in bold condensed uppercase (Barlow Condensed or similar); captions in clean sans-serif (Inter or similar).
- Code snippets: dark code-editor window with three colored dots (red/yellow/green) on the top bar, monospace font, syntax highlight in blue/cyan/green.
- Captions: burned-in subtitles for ALL speech, 2 lines max, white text with subtle dark background box, key words highlighted in cyan. Keep captions inside the safe area (not in the top 14% or bottom 20% of the vertical frame).
- Pacing: remove silences, breaths and false starts; tight jump cuts. Add subtle punch-in zooms (105–115%) every 3–5 seconds on talking-head shots to keep energy.
- Audio: normalize voice to -14 LUFS, light noise reduction. Background music: modern dark electronic/tech beat, low volume under voice (~-24 dB), tense in Part 1–2, more confident and uplifting from Part 3 onward, rising in Part 6–7.
- Transitions: fast, clean cuts or quick whip/glitch transitions between parts. No slow fades.
- Do NOT change or rewrite any spoken content. Do NOT generate new faces or voices.

PART 1 — HOOK (0:00–0:15) — file: parte-1-gancho
- Open IMMEDIATELY on the code snippet full-screen (no intro, no logo), with a quick typing animation:
    Console.WriteLine("1");
    Task tarefa = ExemploAsync();   // imprime "A", espera, imprime "B"
    Console.WriteLine("2");
    await tarefa;
    Console.WriteLine("3");
- Sound: deep impact hit at 0:00.
- On-screen headline over the code: "EM QUE ORDEM ISSO IMPRIME?"
- Then cut to the talking head for the rest of Part 1. Keep the code as a small picture-in-picture in the corner while he speaks.
- When he says "derruba dev bom em entrevista técnica", flash text: "DERRUBA DEV BOM EM ENTREVISTA".

PART 2 — IDENTIFICATION (0:15–0:40) — file: parte-2-identificacao
- Talking head.
- When he mentions "record, string?, Span, ValueTask", pop these four words one by one as floating code tags next to his face: record · string? · Span<T> · ValueTask
- On the line "explicar o porquê", show text: "EXPLICAR O PORQUÊ".
- On the last sentence, show text: "O C# MUDOU. NINGUÉM TE MOSTROU O QUÊ."

PART 3 — THE TURN / AUTHORITY (0:40–1:05) — file: parte-3-virada
- Talking head.
- Lower third when he introduces himself: "Fernando Parmezani" / "Dev .NET Sênior & Tech Lead · 18+ anos".
- Full-screen text card (1.5s): "NÃO É DECORAR. É ENTENDER O MODELO MENTAL."
- On "prever o que ele faz antes de rodar", show text: "PREVER ANTES DE EXECUTAR".
- On the book name, show the ebook cover (ebook4.png) sliding in with a blue glow.

PART 4 — WHAT'S INSIDE (1:05–1:40) — file: parte-4-conteudo
- Mix talking head with B-roll of the PDF page screenshots (slow scroll / Ken Burns zoom), if provided.
- As he lists topics, show each as an animated list item with a cyan check icon, synced to his speech:
    ✓ Valor, referência, stack e heap
    ✓ Nullable, records, pattern matching e Span
    ✓ Task, async e await sem mágica
    ✓ ASP.NET Core e Minimal APIs
    ✓ HTTP resiliente e logging
    ✓ LINQ, performance e projeto final
- On "mais de 100 perguntas", show a large animated counter: "+100 PERGUNTAS DE REVISÃO".
- On the appendices line, show three small cards: "GLOSSÁRIO" · "MAPA CLASS × STRUCT × RECORD" · "COLA DE ASYNC/AWAIT".
- Badge in the corner during this part: "10 CAPÍTULOS · LABORATÓRIOS PRÁTICOS".

PART 5 — SOCIAL PROOF (1:40–1:55) — file: parte-5-prova-social + testimonial files
- If parte-5 exists, use it as the intro line ("Não é só eu que estou dizendo...").
- Then show the best 5–8 seconds of each testimonial video, full-screen, with lower thirds:
    depoimento-leandro-oliveira → "Leandro Oliveira · Dev Sênior Full Stack · .NET e Angular"
    depoimento-jeferson-santos → "Jeferson Santos · Dev Full Stack · .NET e ASP.NET Core"
- Pick the most positive, specific sentence from each testimonial. Keep their original audio; lower the music further during testimonials.
- Burn in captions for the testimonial speech too.

PART 6 — OFFER + GUARANTEE (1:55–2:20) — file: parte-6-oferta
- Talking head, with the ebook cover appearing beside him.
- On the price, show a big price card: "R$ 27,90" with the subtitle "pagamento único · acesso imediato".
- On "7 dias de garantia", show a shield badge: "GARANTIA DE 7 DIAS · 100% DO SEU DINHEIRO DE VOLTA".
- Small text: "PDF · celular ou computador".

PART 7 — CALL TO ACTION (2:20–2:30) — file: parte-7-cta
- Talking head.
- Animated arrow pointing DOWN with pulsing text: "CLIQUE NO BOTÃO ABAIXO".
- When he reveals the answer, bring back the code snippet from Part 1 and highlight the output in cyan, one item at a time: 1 → A → 2 → B → 3
- Final text: "ENTENDA O PORQUÊ NO CAPÍTULO 6".
- End card (2s): ebook cover + "C# MODERNO SEM MEDO" + "R$ 27,90". No outro music tail longer than 1s.

DELIVERABLES
1. Full VSL 9:16 (for Reels/Stories/sales page on mobile)
2. Full VSL 16:9 (for the sales page on desktop)
3. Bonus: a 30-second cutdown using Part 1 + best lines of Part 4 + Part 6 + Part 7, in 9:16, for ads.
```

---

## Três cuidados
1. **Confira o texto das legendas** antes de publicar, principalmente os termos técnicos (`Span<T>`, `ValueTask`, `async/await`). A transcrição automática costuma errar nesses termos.
2. **Nada de texto prometendo emprego ou aprovação.** O roteiro de edição já evita isso. Se o editor sugerir algo como "passe na entrevista", corte.
3. Se o Higgsfield não aceitar montar vários clipes num projeto só, **o mesmo roteiro serve para o CapCut** ou para um editor humano.

Quando o vídeo estiver pronto, posso colocar a VSL na página de vendas, no topo antes do botão. Esse é o lugar onde ela mais converte.
