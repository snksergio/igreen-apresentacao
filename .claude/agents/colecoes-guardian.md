---
name: colecoes-guardian
description: Adiciona, remove ou reordena ITENS de uma lista/coleção (cards do ecossistema, badges, planos, frentes da recorrência, produtos, graduações) sem quebrar posição, animação, apresentação e páginas internas. Use SEMPRE que o pedido for "adicionar mais um", "tirar esse", "trocar a ordem" de algo repetido. É o pedido mais comum e o que mais quebra.
tools: Read, Grep, Glob, Edit, Bash, mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page, mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate, mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script, mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot
---

"Adiciona mais um card" parece o pedido mais simples do mundo e é o que mais quebra este site. O motivo: **a quantidade de itens está codificada à mão em vários lugares diferentes**, e nenhum deles reclama quando fica dessincronizado — o item novo simplesmente não anima, não aparece, ou fica sem posição.

**Comece lendo `.claude/referencias/colecoes-por-secao.md`** — é o mapa seção por seção: quantos itens existem hoje, onde cada uma esconde contagem fixa, e o que a apresentação faz com ela. Cobre trajetória, órbita (o mais delicado), ecossistema, recorrência, sede, eventos, planos, graduações e as páginas internas.

Antes de mexer, **faça o inventário abaixo**. É rápido e evita o retrabalho.

## Os 6 acoplamentos que precisam ser verificados

### 1. Posição fixa por índice
A recorrência posiciona seus 7 cards com classes `.g1` a `.g7`, cada uma com `left/top` próprios — e há um conjunto **diferente** dentro do `@media (max-width:1024px)`. Um oitavo card **não tem posição**: ele empilha no canto.

```bash
grep -n "\.g[0-9]{" index.html      # quantas posições existem, e em quantos blocos
```

Ao adicionar: crie a posição nos **dois** blocos (desktop e mobile) e confira que não sobrepõe vizinho. Ao remover: decida se renumera (mexe em tudo) ou deixa o buraco (mais seguro).

### 2. Animação por índice (`nth-child`)
Há ~20 regras com `nth-child(N)` fixo, principalmente cascatas de reveal com `transition-delay` escalonado. Exemplo real: a cascata da sede cobre `nth-child(1)` a `(4)`. **Um quinto badge nasce invisível** — a regra que o revelaria não existe.

```bash
grep -o "nth-child([0-9]*)" index.html | sort | uniq -c
```

Ao adicionar item numa lista que tem cascata: **acrescente a regra do novo índice**, seguindo o passo de ~80ms. Ou, melhor, troque por uma solução que não dependa de contagem — mas isso é mudança maior, combine antes.

### 3. Modo apresentação — um passo por item
O ecossistema dá um passo de apresentação **por card** (`ecoCards()[k]`, `ecoStopIndexFor`). Mudar a quantidade muda o número de paradas, logo muda a duração da apresentação inteira e a posição relativa de tudo depois.

Há também uma constante de duração acoplada ao deck (`CARO = 5` em `js/presentation-mode.js`), casada com a animação de scroll do deck no `index.html`. Se você mexer no tempo do deck, as paradas por card saem de sincronia.

**Sempre** passe pelo `apresentacao-guardian` depois: as 11 paradas, passo a passo, para baixo e para cima.

### 4. Altura da seção → tudo abaixo
Item novo geralmente muda a altura da seção, o que desloca todas as seções seguintes e altera start/end de pins. Chame o `scroll-guardian` **antes** de mexer e o `geometria-guardian` depois.

### 5. Link para página interna
Cards do ecossistema apontam para `produtos/conexao*.html`. Card novo precisa de página — use `produtos/template.html`, nunca copie de `produtos/legados/` (arquivos mortos). E a transição de página (`js/page-transition.js`) faz prefetch: confirme que o link novo funciona na ida **e** na volta.

### 6. Carrossel / trilha horizontal
Se a lista é uma trilha que desliza (`.etrack`), a largura total e o ponto final do deslocamento normalmente derivam da contagem. Confira se é calculado ou fixo — se for fixo, o item novo fica fora da área visível.

## Roteiro

1. **Conte hoje:** `grep -c 'class="ecard' index.html` (ou o seletor equivalente).
2. **Rode o inventário** — os 3 greps acima. Anote o que é fixo.
3. **Capture o ANTES:** geometria nas 3 configs + as 11 paradas da apresentação.
4. **Faça a mudança**, atualizando *todos* os pontos fixos que o inventário revelou — inclusive o bloco mobile.
5. **Valide:** o item novo aparece e anima? A seção continua cabendo (`responsividade-guardian`)? As paradas seguem funcionando? A geometria abaixo deslocou de forma **uniforme** (esperado) e nada mudou na horizontal?
6. **Se o item tem imagem**, passe pelo `ativos-guardian`; se tem vídeo ou animação nova, pelo `performance-guardian`.

## Sinais de que você esqueceu algo

| sintoma | causa provável |
|---|---|
| item novo não aparece / não anima | falta a regra `nth-child(N)` da cascata |
| item novo empilhado no canto | falta a posição `.gN` (e a do mobile) |
| item novo fora da tela numa trilha | largura ou deslocamento fixo, não calculado |
| apresentação pula ou trava numa parada | contagem de paradas mudou sem revalidar |
| seção seguinte "subiu"/"desceu" | esperado: a altura mudou. Confirme que é **uniforme** |
| clique no card não vai a lugar nenhum | página interna não existe |

Nunca entregue dizendo "adicionei o card". Diga o que mais foi ajustado por causa dele — é isso que prova que você olhou os seis pontos.

## Ofereça as duas opções ao dono

As contagens fixas são a **causa raiz** de "adicionar um item quebra". Existem dois caminhos, e o dono decide — **os dois dão o mesmo resultado visual**:

**A) Na mão (padrão).** Acrescente o índice novo em cada ponto fixo que o inventário revelou: a posição `.gN` (nos dois blocos, desktop e mobile), a regra `nth-child(N)` da cascata, e o que a apresentação precisar. Mais rápido para um item só, e não mexe no que já funciona.

**B) Eliminar a contagem fixa (melhoria).** Trocar as regras `nth-child(N)` por delay calculado — por exemplo uma variável CSS de índice no elemento (`style="--i:5"`) com `transition-delay: calc(var(--i) * 80ms)`, ou `nth-child(n)` genérico. E derivar as posições em vez de escrevê-las uma a uma. Depois disso, adicionar item passa a mexer **só no HTML**.

O dono já sinalizou que **não quer fazer B agora** — o site é institucional e quase não cresce, então conviver é aceitável. Mas **mencione a opção** quando ele pedir o segundo ou terceiro item da mesma lista: a partir daí B começa a compensar. Se ele escolher B, é refatoração de código existente: capture o ANTES, faça, e prove com o `geometria-guardian` que o resultado visual é idêntico.
