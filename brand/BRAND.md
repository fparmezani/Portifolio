# Identidade visual: Fernando Parmezani

Extraída de https://fernandoparmezani.com.br em 05/10/2026. Os tokens ficam em [brand.css](brand.css). Os arquivos originais estão em `C:\Projetos\Portifolio\assets`.

## Cores

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#020814` | Fundo principal (azul-marinho quase preto) |
| `--bg2` | `#06111f` | Fundo secundário |
| `--blue` | `#0d6efd` | Cor principal: botões, destaques, brilho |
| `--accent` | `#1d4ed8` | Fim do gradiente azul |
| `--deep` | `#073d92` | Fim do gradiente dos botões |
| `--cyan` | `#38bdf8` | Detalhes técnicos e código (usar pouco) |
| `--link` | `#83bdff` | Texto de tags e links |
| `--text` | `#f8fafc` | Títulos e texto principal |
| `--muted` | `#a8b3c7` | Texto de apoio |
| `--soft` | `#708096` | Rodapé e metadados |
| `--line` | `rgba(59,130,246,.25)` | Bordas de painéis e tags |

Gradiente de destaque: `linear-gradient(135deg, #2e8bff, #0d6efd, #1d4ed8)`.

## Tipografia
- **Sora** (700/800) para títulos. Títulos de capa em CAIXA ALTA com tracking negativo (`-0.055em`).
- **Inter** (400 a 900) para texto. Tags em caixa alta, 700, tracking `+0.14em`.

## Elementos visuais
- Fundo escuro com brilho radial azul atrás da foto
- Grade de pontos azuis que desaparece nas bordas
- Tag em pílula com ponto azul brilhante (ex.: "SENIOR .NET ENGINEER / TECH LEAD")
- Última palavra do título em gradiente azul
- Painéis com borda azul translúcida, raio de 18px e sombra profunda
- Foto recortada (PNG transparente) no canto inferior direito

## Assets (`brand/assets`)
- `logotipo.png`: monograma FP, 1080×1080, transparente
- `fernandoparmezani.png`: foto recortada, 1080×1080, transparente (usada na capa)
- `fernandoparmezanipsd1.png`: foto recortada, 1536×1024, transparente
- `fernandoparmezani-1.png`: foto com fundo, 1122×1402

## Formato dos posts
- Feed e carrossel: 1080×1350 (4:5), margens de 84px
- Modelos: [capa](../templates/capa.html), [conteúdo](../templates/conteudo.html) e [CTA](../templates/cta.html)
- Para renderizar em PNG, use o Chrome headless:
  `chrome --headless=new --hide-scrollbars --window-size=1080,1350 --virtual-time-budget=4000 --screenshot=C:/.../saida.png file:///C:/.../slide.html`
