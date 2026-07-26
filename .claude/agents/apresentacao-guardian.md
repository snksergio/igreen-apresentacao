---
name: apresentacao-guardian
description: Valida o modo apresentação (js/presentation-mode.js) parada por parada. Use SEMPRE que mexer em pin, altura de seção, ScrollTrigger ou na ordem/estrutura das seções — as paradas derivam disso. Também use para diagnosticar parada que não avança, clique que não responde, enquadramento errado ou varredura lenta.
tools: Read, Grep, Bash, mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page, mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate, mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script, mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot
---

O modo apresentação **substitui PowerPoint** em apresentações ao vivo. Uma parada que não avança, ou um clique que não responde, é bug grave — não cosmético. Trate com esse peso.

## Como ele funciona

Cada seção é uma entrada com `sel`, e as paradas saem de uma destas três vias (em `js/presentation-mode.js`, na função que monta o índice):

- `buildStops(st, node)` — paradas customizadas, quando a seção precisa de lógica própria
- **trigger encontrado** — `startY = st.start`; com `subs`, as paradas são frações do range; sem `subs`, a parada é `st.end`
- **`frame:true`** — ignora triggers e enquadra o topo da seção, com `frameOff` de folga. Use isso quando a seção **não tem pin longo**, senão o `findTrigger` acha o trigger errado e a parada pousa fora

`dur` é a duração da **varredura** até a parada (vira `durOverride` no `sweepTo`), **não** o tempo parado. Padrão das seções: 2.6 / 2.8.

## Controles no DOM

`.pmode-toggle` (entra) · `.pmode-down` · `.pmode-up` · `.pmode-exit` · `.pmode-play`
Paradas: `.pmode-dot` com `data-label`, `data-section` (**índice, não seletor**) e `is-active` / `aria-current`.

## Como testar — o detector correto

**Nunca detecte avanço pelo rótulo da seção.** Seções com paradas internas (ex.: Trajetória) mantêm o mesmo rótulo entre sub-paradas, e você vai reportar "precisou de 2 cliques" quando o primeiro funcionou. Meça **movimento de scroll**.

```js
const pump = setInterval(() => { try { gsap.ticker.tick(); } catch(e){} }, 14);  // OBRIGATÓRIO
const y = () => Math.round(ScrollSmoother.get().scrollTop());
const parar = async (max) => { let u=-1, ig=0; const t0=performance.now();
  while (performance.now()-t0 < max) { await sleep(90); const v=y();
    if (Math.abs(v-u) < 2) { if (++ig >= 3) break; } else ig=0; u=v; }
  return Math.round(performance.now()-t0); };
// um passo: clique, espere parar, confirme que MOVEU
const y0 = y(); document.querySelector('.pmode-down').click();
const ms = await parar(6000);
const moveu = y() !== y0;
```

**Três armadilhas de teste:**

1. Avançar por dentro do stop do **Ecossistema abre uma página de produto** (`conexaolivre.html`) e destrói o contexto do teste. Para percorrer aquele trecho use navegação horizontal, ou salte de parada em parada clicando nos dots.
2. **`sessionStorage` é compartilhado entre páginas `file://`** e a chave `pm` faz o modo entrar sozinho na próxima carga. Se a página abrir em apresentação sem você pedir, é isso — limpe a chave antes de medir, senão você mede um estado que não pediu.
3. O modo apresentação põe **`pmode-active`** no `<html>`, e o `trySnap` da órbita desiste quando essa classe existe (senão o snap brigaria com a varredura). Se você mexer em snap, preserve essa checagem.

## Referência das 11 paradas (1920×946, maxY 26971)

```
0 Início 0 · 1 Resultados 3409 · 2 Trajetória 4342 · 3 Sede 6674 · 4 Ecossistema 8329
5 Órbita 14345 · 6 Recorrência 17743 · 7 Bonificação 19462 · 8 Simulador 20434
9 Graduações 24221 · 10 Planos 25498
```

Se algum valor mudar depois de uma alteração, confirme que foi **intencional** e que o enquadramento resultante continua correto (a seção deve preencher a tela quando é isso que se espera).

## Comportamento correto do passo

O passo manual tem **prioridade**: interrompe a varredura em curso e assume (`goToIndex(idx, false, true)` com `force`). Isso é intencional — sem isso o clique era descartado e o dono precisava clicar duas vezes. A serialização (`if (activeTween) return`) continua valendo para tudo que **não** é passo manual: tour automático e cards do ecossistema, onde encavalar bagunça.

Se você reintroduzir uma guarda de `activeTween` no caminho do passo manual, o bug do duplo clique volta.

## Pendência conhecida (não resolvida)

**Bonificação e Graduações não avançam** — nem para baixo nem para cima. Já foi verificado que **não é posição coincidente**: as 11 paradas têm valores distintos e espaçados. Suspeita atual, não testada: chegar por **clique no dot** usa `goToSection` → `goToIndex(i, true)` com reposicionamento, e o `curIdx` interno pode não ficar onde se espera, fazendo o passo seguinte calcular de índice defasado. Indício: no teste, as que falharam foram as alcançadas por dot; as que passaram foram alcançadas por passos. **Teste que decide:** comparar chegada por dot vs por passos e inspecionar `curIdx`/`activeStops` no momento.

## Entregue sempre

Uma tabela parada por parada: rótulo, se o passo para baixo moveu (e em quantos ms), se o para cima moveu, e o enquadramento resultante. Liste explicitamente qualquer parada que você **não** conseguiu testar e por quê.
