# 01: Topo pessoal da página "Sobre"

> **Difficulty:** Standard: **suggested model:** Sonnet (Claude Code) / Sonnet (Cursor). Suggestion only, use whatever model you have to hand.

**Spec:** ../SPEC.md

**What to build:** o topo da página "Sobre" passa a ser pessoal: selo, título, subtítulo e bio de 5 parágrafos aprovados na spec, com a idade calculada a cada requisição a partir da data de nascimento (fuso de São Paulo); a lista "Fora do trabalho" com 6 hobbies no lugar de "Principais conquistas"; 4 cartões pessoais (Idade, Mora em, Estudando agora, Formação) com ícones vindos dos dados; a foto de avatar no lugar das iniciais. A seção de filosofia abaixo e o modo de manutenção não mudam.

**Seams:** None (por regra do projeto, sem testes automáticos; verificar com `pnpm check`, `pnpm typecheck`, `pnpm build`).

**Blocked by:** None (can start immediately)

Status: ready-for-human

- [x] Selo, título (com "Conan" em destaque), subtítulo e bio idênticos aos textos aprovados na spec, vindos de `site.json` → `about`
- [x] Data de nascimento `2001-07-30` no perfil de `site.json`, com `SiteData` atualizado; nunca exibida no site
- [x] Idade calculada por helper puro com a data de hoje em `America/Sao_Paulo`, usada na bio (`{idade}`) e no cartão "Idade", calculada uma vez por renderização
- [x] Lista "Fora do trabalho" com os 6 itens da spec, na ordem, com ícone escolhido por campo nos dados
- [x] Cartões Idade, Mora em, Estudando agora (Inglês, B1 (nov/2025)) e Formação, com ícone escolhido por campo nos dados (sem comparar rótulo em português)
- [x] Foto de avatar do perfil via `next/image`, com texto alternativo; iniciais removidas; sem repetir "Florianópolis, SC" em dois lugares próximos
- [x] Rótulos fixos do componente do topo movidos para `messages/pt.json` (namespace `about`); `about.subtitle` atualizado ou removido se sem uso
- [x] Campos antigos de `about` sem uso removidos de `site.json` e de `SiteData`
- [x] Com `APP_ENV=production` a página continua mostrando a manutenção
- [x] `pnpm check`, `pnpm typecheck` e `pnpm build` passam
