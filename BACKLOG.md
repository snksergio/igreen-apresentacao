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

## 3. Modo Apresentação — navegar páginas internas (produtos)
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
