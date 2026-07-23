# Backlog — iGreen landing (Organizado)

Itens pausados para retomar depois. Ordem sugerida: 1 → 2 → D2/D3.

## 1. Links sociais do footer
Os links de redes sociais no rodapé estão como `href="#"` (placeholder):
Instagram, LinkedIn, YouTube, Facebook.
**Ação:** substituir pelos URLs reais quando o usuário fornecer.
**Onde:** `index.html`, seção `<footer id="rodape">`, lista `.ft-soc`.

## 2. Conteúdo real (trocar placeholders pelo fiel)
Passo sugerido: primeiro um **audit** (mapear cada imagem/vídeo como "real" vs "placeholder/stock"), depois trocar.
- **Logos de parceiros** do carrossel da órbita — os reais já existem em `../assets/imgs/logos`
  (Casas Bahia, Cinemark, Forbes, GPTW, Pague Menos, Vibra, Comerc, Domino, Dograsil).
- **Mockups do app** nas telas do celular (hoje a tela aparece vazia/preta).
- **Fotos fiéis** — fotos-ano (2021–2025), sede, eco, carros.
**Regra:** trocar arquivo em `assets/` mantendo o mesmo nome = não precisa mexer no HTML.

## 3. Modo Apresentação — navegar páginas internas (produtos) — ✅ IMPLEMENTADO
> Feito: motor de apresentação generalizado (auto-detecta seções), handoff via `sessionStorage`,
> e **tour do ecossistema** (↓ abre o produto do card, percorre, volta focando o próximo; ← → trocam
> card sem abrir; Esc no produto pula pro próximo; após o último → órbita). Descrição original abaixo.

Hoje o modo apresentação (toggle na navbar + rail de dots à esquerda) navega as seções da
`index.html`. Os cards do **Ecossistema** são clicáveis e levam a páginas internas
(`produtos/*.html`) via `page-transition.js`. Objetivo: em apresentação, ao focar um card,
**abrir a página do produto, navegar as seções internas dela, fechar e voltar ao card**
para seguir ao próximo produto — sem "perder" o estado da apresentação.
**Desafio:** o `presentation-mode.js` vive na `index.html`; abrir um produto é navegação de
página real (muda a URL, novo documento) → o estado do modo se perde.
**Abordagem recomendada (B):** navegação real + "passagem de bastão" via `sessionStorage`
(reaproveita a cortina e o padrão que o `page-transition.js` já usa):
1. No index, clicar no card em apresentação → salva no `sessionStorage`: modo ativo, produto,
   e a posição de retorno (índice do card no ecossistema).
2. Vai para o produto (cortina existente).
3. O produto carrega um `presentation-mode.js` **genérico/reutilizável** → detecta o contexto,
   entra em apresentação, mapeia as seções da página e mostra um botão "voltar".
4. Ao voltar → flag no `sessionStorage`; o index no load restaura o modo no ecossistema, no card
   certo, pronto para o próximo produto.
**Custo principal:** mapear as seções de cada página de produto (incremental, como na index).
Cai bastante se as páginas de produto compartilharem estrutura/classes.
**Alternativas:** (A) overlay com iframe (retorno perfeito, mas iframe + ScrollSmoother +
ponte `postMessage` é frágil); (C) abrir normal e usar o back do navegador (simples, sem fluidez).

## 4. Modo Apresentação nas telas internas — validar visibilidade do conteúdo (+ substeps)
Nas páginas de produto (`produtos/*.html`), o modo apresentação hoje **auto-detecta cada
`<section>`/`header.hero`** e cria 1 stop por seção (enquadra o topo com offset ~88px). Problema
conhecido: **em vários steps o conteúdo NÃO fica todo visível** — seções mais altas que a viewport
(ex.: simulador, listas, blocos) ficam cortadas, e o enquadramento "topo" não garante ver o miolo.
**Objetivo:** revisar seção por seção (e por resolução, principalmente notebook 1360×700) se cada
step mostra o conteúdo relevante; onde não couber, **adicionar substeps** (rolar dentro da seção em
2+ paradas) ou ajustar o ponto de enquadramento — do mesmo jeito que foi feito na index (trajetória,
graduações, planos com beats).
**Onde:** `js/presentation-mode.js` — `buildAutoSections()` (auto-detect) e o cálculo do stop das
seções `frame` (hoje `head.top - 88`). Provavelmente criar `buildStops` por página/seção quando fugir do padrão.
**Custo:** médio; incremental por seção. Casa com o item de "tratar imagens" (conteúdo real ajuda a medir alturas).

## D2. Extrair CSS custom → `css/styles.css`
**Risco:** médio. O `<style>` do footer é movido por JS para dentro de `#smooth-content`;
CSS é interligado por seção (cuidado com especificidade).
**Ganho:** estilo num lugar só.

## D3. Extrair JS custom da landing → `js/app.js`
**Risco:** alto. Ordem de execução importa (ScrollSmoother) e há script que reposiciona
nós do DOM (footer). Fazer por último, testando isoladamente.
**Ganho:** código separado do markup.

> Nota: D2/D3 foram adiados porque a landing funciona e as telas internas usam `css/tokens.css`
> (não o CSS gigante da landing), então o custo/risco de desmontar o inline não compensa agora.

---

## Já concluído (referência)
- Organização + de-inline (8MB → ~340KB), assets externalizados.
- Refino mobile (tipografia/espaçamentos padronizados).
- Logo da marca (navbar + footer) + favicon neon.
- Endereço da sede corrigido (Uberlândia-MG).
- Git iniciado; D1 (libs GSAP em `assets/vendor/`).
- Correções pós de-inline: ScrollTrigger refresh (FOUT), detecção da mão, PNGs faltando, logo mobile via `<img>`.
- **Modo Apresentação** (desktop): rail de dots + setas + auto-play + teclado + captura de roda; navegação por seções e subseções (marcos da trajetória, cards do ecossistema, views da órbita, barras + modal das graduações, planos+footer); reduced-motion/a11y.
- **Tour das páginas internas** (produtos conexao*): ↓ abre o produto do card, percorre, volta focando o próximo; ← → trocam card; Esc pula; após o último → órbita.
- **Responsivo notebook** (small/short desktop, `@media max-height:900`): ecossistema/resultados/recorrência/bonificação/simulador/planos ajustados sem afetar mobile nem telas grandes; rail recolhe em telas ≤1500px.
- **Fix transição na Vercel**: chave de restore normalizada (`/` = `/index.html`) e produtos sempre no topo.
- **Publicado na Vercel** (repo `snksergio/igreen-apresentacao`, raiz = Organizado).
