# Spec — 7 melhorias na landing iGreen (2026-07-23)

Landing `index.html` (GSAP + ScrollSmoother; desktop com smoother, mobile sem) + 7 páginas
`produtos/conexao*.html` + `js/presentation-mode.js`. Todas as tarefas são pequenas e
independentes. **Regra do usuário: NÃO commitar/subir nada automático** — implementar,
o usuário valida no navegador, e só depois subir para o Git/Vercel (já em produção p/ testes).

Validação preferencial: Chrome DevTools MCP (mobile ~390px, notebook 1360×700, desktop grande).

---

## Tarefa 1 — Fotos da timeline "Como funciona" no mobile (páginas de produto)

**Estado atual:** cada `conexao*.html` tem a seção `.como .steps` (timeline vertical de 4 passos
`.cstep`), cada passo com `<figure class="im"><img src="passo-*.jpg"></figure>`. Ordem no DOM:
`.dot` → `.tt` (título h3) → `p` → `.im`. Desktop: grid `48px 1fr minmax(180px,300px)`.
Mobile `@media (max-width:760px)`: `.cstep{grid-template-columns:48px 1fr}` e **`.cstep .im{display:none}`**
(ex.: `conexaolivre.html:236-237`).

**Objetivo:** no mobile, a foto do passo **reaparece**, posicionada **acima do título** do passo e
**menor**. Aplicar nas **7 páginas** de produto.

**Abordagem:** no bloco `@media (max-width:760px)`, trocar `display:none` por exibir `.im` na coluna
de conteúdo, acima do `.tt` (via `order`/grid-row), com tamanho reduzido (largura contida, ex.
`max-width` modesto ou altura limitada; manter `aspect-ratio`). Cada arquivo tem CSS inline próprio →
mesma edição replicada nos 7.

**Arquivos:** `produtos/conexaolivre.html`, `conexaogreen.html`, `conexaoplacas.html`,
`conexaosolar.html`, `conexaotelecom.html`, `conexaoseguros.html`, `conexaoexpansao.html`
(regra `.cstep .im` no `@media (max-width:760px)`). **Risco: baixo (só CSS).**

---

## Tarefa 2 — Vídeos tocam só quando em foco (performance)

**Estado atual (index):** tocam **sempre** (autoplay/loop, sem pausar fora de tela):
`.segv`×4 (`index.html:1856/1858`), `.pbg.orb-pbg` (`1974`), `.hqbg` no mobile (`5239-5243`),
`.evid` dos cards no mobile (`3353` + `5265-5268`). "Só em foco" hoje = `.carvid` (carro, `2349`+`3259-3266`).
**Não existe** IntersectionObserver central de pausa por visibilidade. Páginas de produto: 1 vídeo hero
autoplay/loop cada (`conexao*.html:~507-564`), sem controle JS.

**Objetivo:** vídeos de fundo/loop rodam **só quando visíveis** (play ao entrar, pause ao sair),
reduzindo travadas. Escopo: **mobile (index + produtos) e também desktop**, validando ganho no DevTools.

**Abordagem:** um utilitário único — IntersectionObserver que observa os vídeos-alvo e faz
`play()`/`pause()` conforme `isIntersecting` (threshold ~0.1–0.25). NÃO desconectar (contínuo, ao
contrário dos IO one-shot de reveal). Aplicar aos vídeos de fundo/loop; **não interferir** no `.carvid`
(one-shot próprio) nem no scrub da sede no desktop (Tarefa 3). Nas páginas de produto, incluir o vídeo
hero. Respeitar `prefers-reduced-motion` (já pausa esses vídeos).

**Arquivos:** `index.html` (novo bloco JS) + `produtos/conexao*.html` (incluir o utilitário; idealmente
extrair p/ um pequeno `js/video-inview.js` compartilhado e referenciar nas 8 páginas). **Risco: baixo/médio.**

---

## Tarefa 3 — Vídeo da sede em loop no modo apresentação

**Estado atual:** `.hqbg` (`#sede`) no desktop é **scrubbed** pelo scroll
(`index.html:3313-3316`: `hqbg.currentTime = progress*dur`). No modo apresentação a sede tem só `dur`
(`presentation-mode.js:65-67`), sem `onEnter/onLeave` — a varredura de scroll é que empurra o vídeo.
Modelo de "tocar ao entrar" já existe na Bonificação (`presentation-mode.js:126`).

**Objetivo:** ao **entrar** na sede no modo apresentação, o vídeo toca em **loop** sozinho, sem depender
do scroll; ao **sair**, volta ao normal.

**Abordagem:** na config da sede (`presentation-mode.js`) adicionar `onEnter` (setar `hqbg.loop=true`,
`play()`, e **ligar uma flag** que suspende o write de `currentTime` do scrub) e `onLeave`
(desligar flag, `pause()`/reset, `loop=false`). No scrub de `index.html:3313-3316`, gate:
`if (window.__sedePMHold) return;` antes de escrever `currentTime`. Assim o loop nativo não briga com o
scrub. (No mobile o scrub não roda; a sede já é loop nativo.)

**Arquivos:** `js/presentation-mode.js` (config sede) + `index.html` (gate no `onUpdate` do scrub).
**Risco: médio — o conflito scrub×loop é o ponto de atenção; testar entrada/saída/setas.**

---

## Tarefa 4 — Recorrência no mobile: respiro + descomprimir

**Estado atual (mobile ≤1024px):** `.recwrap{zoom:.48;height:1400px}` (`index.html:1696`) comprime a
colagem de 7 `.rfloat` + header sobreposto; paddings quase nulos entre blocos: `.recstage` pb 10px (1685),
`.recgrid` pt 6px (1712), `.rectitle2` mt 6px (1717), `.recblocks` gap 12px (1721), `.rblock` padding
15/16 (1722). Header `.rechead` absoluto centralizado com `margin:0` (1688-1690) sobre a colagem.

**Objetivo:** menos poluição — mais respiro entre elementos e cards um pouco maiores/legíveis.

**Abordagem (respiro + descomprimir):** reduzir a compressão (subir `zoom` de .48 para algo como
~.6–.7 e reajustar `height`/posições dos floats `1704-1710` para não colidirem); separar a colagem do
bloco "Seis frentes" (subir `.recstage` padding-bottom e `.recgrid` padding-top); aumentar
`.rectitle2` margens (1717-1719), `.recblocks` gap (1721) e `.rblock` padding (1722). Ajustar posições
via DevTools iterativamente até ficar limpo.

**Arquivos:** `index.html`, bloco `@media (max-width:1024px)` (linhas ~1685-1722). **Risco: baixo (CSS mobile).**

---

## Tarefa 5 — Modais de eventos para todas as graduações

**Estado atual:** array `EVENTS` (`index.html:4958-4963`) tem 2 itens (Gestor, Executivo). Campos por
evento: `name, color, rgb, pin` (medalha PNG), `logo` (HTML do título). Fotos são placeholder SVG
(`PHOTO`, `4956`; `photos(n)`, `4964`) — sem fotos reais. Dots e navegação do modal e do **modo
apresentação** contam os `.gm-dot` em runtime (`presentation-mode.js:156-159`), então ajustam sozinhos.

**Ordem canônica (menor→maior até Acionista):** Sênior → Gestor → Executivo → Diretor → Acionista.
Medalhas disponíveis: `assets/pins/{SÊNIOR,GESTOR,EXECUTIVO,DIRETOR,ACIONISTA}.png`.

**Objetivo:** adicionar **Sênior, Diretor, Acionista** ao `EVENTS`, na ordem, resultando em 5 slides.

**Abordagem:** inserir 3 objetos no array com `name/color/rgb/pin/logo`. Títulos pelos prêmios do site:
Diretor e Acionista → "Viagem Internacional"; Sênior → "Treinamentos e Eventos". Cores conforme `DATA`
(Sênior verde, Diretor prata, Acionista ouro). Fotos seguem placeholder. Nenhuma mudança no modo
apresentação (auto-ajusta).

**Arquivos:** `index.html:4958-4963`. **Risco: baixo.** Testar o modal (5 dots) e o modo apresentação
(percorre os 5).

---

## Tarefa 6 — Graduação no mobile: cards alinhados + sticky maior

**Estado atual (mobile):** cards `.grad` (simulador "Qual a sua graduação?", gerados de `GRADS`) em grid
`1fr 1fr` (`index.html:1761`), **sem altura fixa** → nomes longos ("Embaixador 12K") quebram em 2 linhas
e desalinham as linhas do grid. Sticky `.sim-stickybar` (`1776-1785`) tem altura só do `padding:11px`
vertical + `sb-v` 21px → "quase imperceptível".

**Objetivo:** cards com tamanhos **uniformes** (alinhados) e sticky **um pouco mais alto**.

**Abordagem:** dar altura de linha uniforme aos cards (`grid-auto-rows`/`min-height` no `.grad` +
`align-items:stretch`), de forma que nomes longos não desalinhem (ajustar fonte/line-height se preciso).
Aumentar o `padding` vertical (e/ou `min-height`) do `.sim-stickybar`, opcionalmente `sb-v`/`sb-l`.

**Arquivos:** `index.html` (`@media max-width:1024px`, `.grad`/`.grads` `1761-1771`; `.sim-stickybar`
`1776-1785`). **Risco: baixo (CSS mobile).**

---

## Tarefa 7 — Menu: Ecossistema · Simulador · Planos · App

**Estado atual:** `.nav-links` (`index.html:1826-1830`): O Ecossistema (`#ecossistema`→reescrito p/
`#ecossistema2`), Visão de Negócio (`#visao`), Cashback Green (`#cashback`), FAQ (`#faq`). Vários âncoras
não existem (backlog item 5). CTA "Fale conosco" (`#contato`).

**Objetivo:** menu = **O Ecossistema · Simulador · Planos · App**, com âncoras válidas.
- O Ecossistema → `#ecossistema` (o script já reescreve p/ `#ecossistema2`)
- Simulador → `#simulador`
- Planos → `#planos`
- App → `#orbita` (seção do celular)

Removidos: Visão de Negócio, Cashback Green, FAQ. Manter o CTA. Conferir também o menu mobile (overlay).

**Arquivos:** `index.html:1826-1830` (+ verificar overlay mobile). **Risco: baixo (markup/âncoras).**
Fecha o backlog item 5.

---

## Ordem de execução
7 → 1 → 6 → 4 → 5 → 2 → 3 (mais simples/isolados primeiro; 2 e 3 pedem mais teste).

## Fora de escopo
- Fotos reais dos eventos (Tarefa 5 fica com placeholder).
- Foto do marco 2026 na timeline da index (`index.html:1924` não tem `.jphoto`) — não solicitado.
- Refactors não relacionados.
