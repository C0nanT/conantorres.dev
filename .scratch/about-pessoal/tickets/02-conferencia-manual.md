# 02: Conferência manual da página "Sobre"

> **Difficulty:** Light: **suggested model:** Haiku (Claude Code) / claude-4.5-haiku-thinking (Cursor). Suggestion only, use whatever model you have to hand.

> **Gate:** human: abrir http://localhost:3000/about (dev com `APP_ENV=development`) e conferir a página

**Spec:** ../SPEC.md

**What to build:** nada de código: o Conan confere no navegador o topo atual da página "Sobre" (bio, lista "Fora do trabalho", placeholder de foto com fita de manutenção e a rotina "Um dia comum").

**Seams:** None

**Blocked by:** 01

Status: ready-for-agent

- [ ] Bio com os textos desejados, idade 25
- [ ] Placeholder de foto (ícone de pessoa) com a fita "EM MANUTENÇÃO", sem iniciais
- [ ] Lista "Fora do trabalho" com 6 itens e ícones adequados
- [ ] Seção "Um dia comum" com os 4 períodos (manhã, meio-dia, noite, fim de semana)
- [ ] Layout ok no celular, sem rolagem lateral
