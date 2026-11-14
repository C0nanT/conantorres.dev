# Página "Sobre" com foco pessoal

Status: ready-for-agent

## Problem Statement

A página "Sobre" repete o que a página principal já mostra: cargo, anos de experiência, conquistas profissionais, localização e posição. Quem chega nela, normalmente um recrutador, não descobre nada novo e não entende quem o Conan é fora do trabalho: rotina, hábitos, interesses, como lida com responsabilidade. Além disso, o quadro de perfil mostra só as iniciais "CT" no lugar de uma foto.

## Solution

O topo da página "Sobre" passa a ser pessoal e informal, em primeira pessoa. Título, subtítulo, bio, lista e cartões contam a origem, a rotina, os hobbies, o jeito de assumir responsabilidade e de compartilhar conhecimento, e citam a formação em ADS. A idade aparece calculada automaticamente a partir do aniversário, então nunca fica desatualizada. A lista "Principais conquistas" vira "Fora do trabalho", os cartões viram dados pessoais e a foto de perfil substitui as iniciais. A seção de valores e insights mais abaixo não muda agora.

## User Stories

1. Como recrutador, quero ler uma apresentação pessoal e informal, para entender o estilo de vida do Conan além do currículo.
2. Como recrutador, quero que a página "Sobre" traga informações que não estão na página principal, para que a visita valha a pena.
3. Como recrutador, quero ver a idade atual do Conan, para ter contexto sobre o momento de carreira dele.
4. Como Conan, quero que a minha idade se atualize sozinha todo ano, para nunca ter que editar o texto no aniversário.
5. Como Conan, quero que a data exata do meu nascimento nunca apareça no site, para preservar a minha privacidade.
6. Como recrutador, quero saber de onde o Conan é e onde mora, para ter contexto pessoal.
7. Como recrutador, quero conhecer a história de como o Conan começou a programar, para entender que ele aprende fazendo.
8. Como recrutador, quero entender a rotina do Conan, para perceber a disciplina de estudo e de treino.
9. Como recrutador, quero ver os hobbies em destaque visual, para ter uma noção rápida sem ler todo o texto.
10. Como recrutador, quero saber o nível de inglês do Conan e quando ele foi medido, para avaliar com honestidade.
11. Como Conan, quero trocar o nível de inglês e a data só editando os dados do site, sem mexer em componente.
12. Como recrutador, quero ver a formação do Conan, para confirmar a base acadêmica dele.
13. Como recrutador, quero perceber que o Conan assume responsabilidades fora do trabalho, para ver liderança como traço pessoal.
14. Como recrutador, quero perceber que o Conan compartilha conhecimento e incentiva os outros, para entender o perfil de liderança técnica.
15. Como visitante, quero ver uma foto do Conan em vez das iniciais, para associar um rosto ao nome.
16. Como Conan, quero lembrar de trocar a foto depois, nesta página e na principal juntas, para manter as duas consistentes.
17. Como visitante no celular, quero que o topo novo se ajuste bem à tela estreita, para ler sem rolagem lateral.
18. Como visitante que prefere menos movimento, quero que as animações dos ícones respeitem `prefers-reduced-motion`.
19. Como visitante com leitor de tela, quero que a foto tenha texto alternativo e que os ícones decorativos sejam ignorados.
20. Como Conan, quero que os textos fixos da interface (título da lista, rótulos) fiquem nas mensagens do site, seguindo o padrão do projeto.
21. Como Conan, quero que a página continue mostrando o aviso de manutenção em produção até eu decidir liberar, para revisar antes de publicar.

## Implementation Decisions

### Textos aprovados

- Selo acima do título: **Sobre mim**.
- Título: **Prazer, eu sou o Conan**, com "Conan" em destaque (o mesmo estilo de gradiente usado hoje no trecho destacado do título).
- Subtítulo: **Dev de Floripa que nunca parou de estudar**.
- Bio, quatro parágrafos (o quinto, sobre namorada, música e o salsicha, foi removido a pedido por deixar o texto longo demais; depois o texto foi encurtado em cerca de 15%), exatamente este texto (`{idade}` é substituído pela idade calculada):

  > Nasci em Campo Grande (MS), mas cresci em Florianópolis, onde moro até hoje. Tenho {idade} anos e uma mania que me acompanha desde a escola: estudar por conta própria. Nunca parei.
  >
  > A programação entrou na minha vida lá por 2019, por causa de um jogo: eu jogava Sea of Thieves com uma galera no Discord e criei um bot para ajudar a montar as tripulações dos navios. Peguei gosto e não parei mais: veio a faculdade de Análise e Desenvolvimento de Sistemas (UNIASSELVI, 2024) e muito estudo por conta própria.
  >
  > Meu dia começa com café e estudo: um livro, uma linguagem que ainda não domino ou um conceito novo de arquitetura. Depois vêm a academia, o almoço e o trabalho. À noite, jogo xadrez no Chess.com com algo técnico passando no fundo. No fim de semana não tem roteiro: pode ser inglês, IA, mercado financeiro ou mais código. E sempre que dá, corro uns 2 km na Beira-Mar Norte.
  >
  > Gosto de assumir responsabilidade, no trabalho e fora dele. Cuido das minhas finanças e ajudo a minha família a organizar as delas e a começar a investir, por isso acompanho de perto o que acontece no Brasil e no mundo. Também gosto de tomar a frente nas decisões e de passar adiante o que aprendo: quando encontro um bom artigo, livro ou vídeo, compartilho e incentivo todo mundo a ir atrás de mais.

- Restrições de conteúdo já decididas: não usar a palavra "política"; não dizer "muitos livros" (o Conan está lendo o primeiro livro de programação); não sugerir que mora com os pais; não citar os canais do YouTube na bio; não colocar link para o perfil do Chess.com; não mostrar a data de nascimento.

### Lista "Fora do trabalho" (substitui "Principais conquistas")

Seis itens, cada um com ícone (lucide), na ordem:

1. Estudo por conta própria: arquitetura, IA e design
2. Inglês: lendo livros técnicos
3. Xadrez no Chess.com
4. Academia todo dia
5. Corrida na Beira-Mar Norte
6. Mercado financeiro e investimentos

O ícone de cada item vem de um campo nos dados (nome do ícone), não do texto do rótulo.

### Cartões do lado direito (substituem Formação, Experiência, Localização, Posição)

1. **Idade**: a idade calculada.
2. **Mora em**: Florianópolis, SC.
3. **Estudando agora**: Inglês, B1 (nov/2025).
4. **Formação**: Análise e Desenvolvimento de Sistemas, UNIASSELVI, 2024.

O ícone de cada cartão também vem de um campo nos dados, substituindo a função atual que escolhe o ícone comparando o rótulo em português. O nível de inglês e a data da medição ficam nos dados do site, para serem atualizados sem mexer em componente.

### Idade

- Data de nascimento guardada no perfil em `site.json` como `2001-07-30` (dia 30 escolhido por convenção; o dia real não é usado). O tipo `SiteData` ganha o campo.
- A idade é calculada em um helper puro: recebe a data de nascimento e o instante atual e devolve os anos completos, considerando a data de hoje no fuso `America/Sao_Paulo`. Faz aniversário no dia 30 de julho (horário de São Paulo).
- O cálculo roda a cada requisição. A página já chama `connection()` antes de renderizar, então não há valor congelado no build.
- A bio e o cartão "Idade" usam o mesmo valor calculado, uma vez por renderização.
- O marcador `{idade}` na bio é substituído pelo componente; o texto da bio continua em `site.json` → `about.bio`.

### Foto

- O quadro de perfil mostra a imagem de avatar já registrada no perfil em `site.json` (a mesma da página principal), via `next/image`, com texto alternativo com o nome do Conan. As iniciais deixam de aparecer.
- O selo de localização sobre a foto sai, porque o cartão "Mora em" já dá essa informação. Se o implementador preferir mantê-lo, ele pode ficar, mas não deve repetir "Florianópolis, SC" em dois lugares próximos.
- Pendência registrada no `TODO.md` da raiz (arquivo ignorado pelo git): trocar a foto de perfil na página "Sobre" e na página principal ao mesmo tempo.

### Dados e mensagens

- Conteúdo (bio, itens da lista, cartões, subtítulo, título, trecho destacado, selo) continua em `site.json` → `about`. Os campos antigos que deixam de ser usados (`achievements`, `quickFacts` com os valores profissionais, `subheadline` antigo, `headline` antigo) são substituídos, e a interface `SiteData` é atualizada junto (o JSON é apenas convertido, não validado).
- Rótulos fixos da interface que hoje estão escritos dentro do componente do topo (por exemplo, o título da lista) passam para `messages/pt.json`, namespace `about`.
- O subtítulo antigo em `messages/pt.json` → `about.subtitle` ("Desenvolvedor apaixonado por tecnologia e educação") é atualizado para combinar com o novo foco, ou removido se não for usado.

### O que não muda

- A página continua decidindo entre conteúdo e `MaintenancePage` por `APP_ENV`. Em produção ela segue em manutenção; liberar é uma decisão separada.
- Layout geral do topo: duas colunas em tela grande (texto à esquerda, foto e cartões à direita), uma coluna no celular.
- Animações existentes nos ícones continuam com `motion-safe:`.

## Testing Decisions

- Nenhum teste automático, por regra do projeto (`CLAUDE.md`: testes só nos módulos puros do leitor; componentes, páginas e helpers de conteúdo não ganham testes). Decisão confirmada pelo usuário.
- Seams acordados: nenhum.
- Verificação: `pnpm check`, `pnpm typecheck`, `pnpm build`, e conferência manual em `http://localhost:3000/about` com `APP_ENV=development`:
  - textos idênticos aos aprovados, com a idade correta (25 em novembro de 2026);
  - idade muda de 24 para 25 no dia 30 de julho (horário de São Paulo); dá para conferir mudando a data de nascimento temporariamente;
  - foto aparece, sem as iniciais;
  - lista de 6 hobbies e 4 cartões com ícones certos;
  - layout ok no celular (sem rolagem lateral) e com `prefers-reduced-motion`;
  - com `APP_ENV=production`, a página continua mostrando o aviso de manutenção.

## Out of Scope

- Seção "O que me motiva", "Insights Pessoais" e o bloco "Vamos Conversar?" (incluindo a dica das redes sociais e os imports sem uso em `philosophy.tsx`): ficam para uma conversa separada.
- Troca da foto de perfil por uma nova (pendência no `TODO.md`).
- Tirar a página "Sobre" do modo de manutenção em produção.
- Versão em inglês.
- Página principal: nenhuma mudança.

## Further Notes

- Nível de inglês B1 é de novembro de 2025; o Conan vai atualizar no futuro.
- "Salsicha arlequim" é a pelagem que o Conan chama de "mofado" (merle); o texto usa "arlequim".
- O servidor local mostra a página sem manutenção quando iniciado com `APP_ENV=development pnpm dev` (o `.env` local tem `APP_ENV=production`).

- Palavras-chave da bio ficam marcadas com `**texto**` em `site.json` e aparecem em negrito, na cor do texto principal, com hover.
- `about.highlightSymbols` liga uma palavra destacada a um símbolo que vira o cursor do mouse sobre ela, na cor do hover (`--primary`) de cada tema; todas as palavras destacadas têm um (ex.: "xadrez" → ♞).
