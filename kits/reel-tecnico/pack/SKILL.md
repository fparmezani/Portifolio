---
name: editar-video-reel
description: Edita vídeo bruto (take único ou clipes) até um Reel vertical pronto — transcrição, cortes, legendas, cenas e checklist de qualidade. Use quando o usuário pedir para editar o cru, montar o Reel ou cortar erros de gravação.
---

# Editar Reel técnico

Fluxo para transformar fala em câmera em Reel 1080×1920, com cartões de apoio e legendas.

## Fontes que a edição segue

- Roteiro do vídeo (Markdown), se existir
- Identidade visual do criador (cores, fontes, logo)
- Regras de grafia na tela (ex.: fala “C Sharp” → tela “C#”)

## Passo a passo

1. **Ler o vídeo:** resolução, fps, áudio e alguns quadros.
2. **Transcrever** com timestamps por palavra.
3. **Conferir o roteiro:** se as primeiras frases não baterem com o vídeo, parar e perguntar.
4. **Cortes:** alinhar fala e roteiro; aplicar C1–C3. Mostrar a lista de cortes e esperar OK.
5. **Áudio:** limpar ruído sem matar a textura da voz; normalizar volume.
6. **Cor / tratamento:** balanço de branco e contraste; não remover o fundo sem pedido.
7. **Legendas:** frases curtas, destaques nas palavras-chave, sem cobrir cartões importantes.
8. **Cenas:** uma cena por ideia; tempos tirados da transcrição.
9. **Conferir quadros-chave:** texto cortado, legenda sobre cartão, texto duplicado.
10. **Render** vertical 1080×1920 e revisar com o autor.

## Regras de corte

### C1 · Comando de regravação
Quando a pessoa erra, pausa e diz “de novo” / “mais uma vez”, depois repete.

É comando quando:
1. A transcrição tem essas palavras (aceitar variações).
2. Há pausa antes **ou** a fala recomeça logo depois.
3. O roteiro não esperava essas palavras naquele ponto.

Cortar do início da tentativa errada até o fim do comando. Vale a última tentativa.

### C2 · Repetição sem comando
Mesmo trecho duas vezes sem comando: vale a última; marcar “conferir”.

### C3 · Pausas e muletas
- Pausas longas: encurtar, sem zerar (corte seco demais).
- Depois de frases-chave, segurar um respiro curto para a tela respirar.
- Muletas fora do roteiro (“é…”, “ãh”): cortar.

## Checklist de quadro

- [ ] Texto não corta na borda
- [ ] Legenda não cobre o cartão principal
- [ ] Sem texto duplicado
- [ ] Contraste legível no celular
- [ ] Áudio sincronizado após limpeza de ruído

## Formato de saída

- Reel 1080×1920, 30 fps quando possível
- Legendas burn-in ou arquivo separado, conforme o pedido
- Entregar também a lista de cortes aplicada
