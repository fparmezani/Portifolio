# Kit: Reel técnico com Claude

Skill pública para editar Reels técnicos com Claude Code / Cursor.

## O que vem no pacote

- `SKILL.md` — skill instalável
- `prompts.md` — prompts de diretor de edição e legendas
- Este `README.md`

## Instalação (Cursor / Claude Code)

1. No projeto, crie: `.claude/skills/editar-video-reel/`
2. Copie `SKILL.md` para dentro dessa pasta
3. Abra o chat do agente e diga que quer editar um vídeo seguindo essa skill

## O que você precisa ter

- Vídeo bruto (take único ou clipes por linha de roteiro)
- Roteiro em Markdown (opcional, mas melhora os cortes)
- `ffmpeg` no PATH
- Claude Code ou Cursor com a skill carregada

## Aviso

Esta é uma versão **ensinável e genérica**. Não inclui o pipeline interno completo (scripts proprietários, LUTs da marca, paths locais). Use como mapa do processo e adapte às suas ferramentas.
