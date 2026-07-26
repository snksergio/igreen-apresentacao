# Landing iGreen — instruções obrigatórias

Leia isto por inteiro antes de tocar em qualquer arquivo. Este projeto é **pequeno em tamanho e alto em acoplamento**: `index.html` tem ~6000 linhas com CSS e JS inline, e uma mudança visual aparentemente inocente pode quebrar navegação, scroll e o modo apresentação ao mesmo tempo.

O dono do projeto **não é desenvolvedor**. Ele descreve o que quer em linguagem comum e confia que você cuide das consequências técnicas. Nunca devolva a ele uma decisão que você pode tomar com medição.

## As 5 regras que não se negociam

1. **Nunca commite nem faça push sem pedido explícito.** O dono valida no navegador antes. Ele testa na Vercel e estranha quando nada mudou — porque nada foi enviado. Ao terminar, diga o que fez e **pergunte** se pode commitar.
2. **Toda mudança que possa mover pixel passa pelo comparador de geometria** antes de ser entregue. Acione o `geometria-guardian`, ou rode `/validar-tudo`. "Olhei e parece igual" não é validação neste projeto.
3. **Não invente terceiros.** Nada de logos, marcas, fontes, imagens ou links de fora. Todo o design é autoral. Ver `DESIGN.md`.
4. **Não quebre o modo apresentação.** Ele substitui PowerPoint em apresentações ao vivo. Uma seção que não avança é bug grave.
5. **Meça, não deduza.** Este projeto já produziu vários diagnósticos "óbvios" que estavam errados. Sempre que possível, prove com número.

## Anatomia

```
index.html            ~6000 linhas — CSS e JS inline. É a landing inteira.
produtos/*.html       8 páginas de produto (conexao*.html) + template.html
produtos/legados/     10 arquivos MORTOS. Nada aponta pra lá. Não use como referência.
js/presentation-mode.js   modo apresentação (paradas, varredura, dots)
js/page-transition.js     transição entre páginas + prefetch
js/video-inview.js        toca vídeos só quando visíveis (IntersectionObserver)
assets/img|video|fonts
```

Vendors GSAP: core, ScrollTrigger, ScrollSmoother, Draggable, InertiaPlugin.

**ScrollSmoother só existe no desktop** (`min-width:1025px`). No mobile o scroll é nativo. Isso muda tudo: no desktop a posição "real" é a suavizada (`ScrollSmoother.get().scrollTop()`), que **arrasta atrás** do scroll nativo. Escrever `smoother.scrollTop()` direto pula essa suavização e já causou congelamento — ver as armadilhas.

## O fluxo de trabalho esperado

Para qualquer pedido de alteração, siga esta ordem. Existe um agente para cada etapa pesada — use-os para não estourar contexto.

1. **Entenda a natureza do pedido.** Item de lista (adicionar/remover/reordenar)? Cosmético? Estrutural (muda altura/posição)? Ativo novo? Comportamento de scroll? Não cabe na tela? A skill `alterar-site` tem a tabela que decide quais guardiões acionar.
2. **Se mexe em tamanho, posição ou estrutura de seção:** capture a referência ANTES (geometria + enquadramento das âncoras + paradas da apresentação). Sem o "antes", não há como provar o "depois".
3. **Faça a alteração.**
4. **Valide** nas três configurações mínimas: 1920×946 dpr1, 1536×750 dpr1.25, mobile 390×844 dpr3.
5. **Relate** o que mudou, o que foi medido, e o que ficou em aberto. Pergunte antes de commitar.

Comandos: `/validar-tudo` (smoke test completo) e `/desfazer` (voltar atrás com segurança).
Skill principal: **`alterar-site`** — é o ponto de entrada de qualquer pedido.

Guardiões (acione só os necessários, para não gastar contexto):

| agente | quando |
|---|---|
| `geometria-guardian` | qualquer coisa que possa mover pixel |
| `scroll-guardian` | altura/posição de seção, pin, snap, âncora |
| `apresentacao-guardian` | mexeu em pin, altura ou ordem das seções |
| `colecoes-guardian` | adicionar/remover/reordenar item de lista (o mais comum) |
| `responsividade-guardian` | não cabe na tela, "no notebook fica diferente" |
| `ativos-guardian` | imagem ou vídeo novo/trocado |
| `performance-guardian` | animação, mídia, seção nova, ou engasgo relatado |

## Verificação automática

`node .claude/scripts/revisar.js [arquivo]` checa os padrões deste projeto — animação de layout, imagem sem dimensões, referência a terceiros, blend de tela cheia, `progress(1)`, e mais. Cada regra existe porque o problema **realmente aconteceu aqui**.

Um hook roda isso sozinho depois de cada edição em `.html`/`.js` e mostra o resultado. Ele **não bloqueia** — informa. Leia o que aparecer: `ERRO` corrija antes de entregar, `AVISO` confirme se é intencional.

Estado atual da base: **0 erros, 111 avisos** (76 imagens com lazy sem dimensões, 24 blends, entre outros). São dívidas conhecidas, não regressões. Não as conserte em massa sem o dono pedir — mas **não crie novas**.

## Desempenho é requisito, não enfeite

O dono testa num notebook modesto e percebe engasgo antes de qualquer métrica. Orçamento conquistado em sessões anteriores, **não regrida daqui**: bytes desperdiçados até ~400kB (já foi 7,2MB), LCP ~530ms, 1 refresh de ScrollTrigger no boot (já foram 7), zero vídeo decodificando invisível. Metas de campo: LCP < 2,5s · INP < 200ms · CLS < 0,1.

A causa de engasgo aqui quase nunca é o arquivo — é **trabalho por quadro**: camada de tela cheia com `mix-blend-mode` ou `filter`, mídia ampliada, animação de layout. Ver `performance-guardian`.

## Ambiente de teste — leia antes de medir

- **O `requestAnimationFrame` roda a 1 fps** quando a janela do navegador está ocluída/minimizada. Sem `setInterval(() => gsap.ticker.tick(), 14)` a página **não termina de montar** e toda medição mente.
- **Você não mede FPS de forma confiável** nessa condição. Seja honesto: meça bytes, latência, contagem de camadas — e diga que "ficou mais fluido?" só o notebook do dono responde.
- Se o MCP do Chrome DevTools travar: outra conversa Claude pode estar usando o mesmo perfil de navegador. Só um por vez.
- `file://` gera erro de CORS de fonte no console. É conhecido e não conta como erro novo.
- **`sessionStorage` é compartilhado entre páginas `file://`.** A chave `pm` faz o modo apresentação **entrar sozinho** na próxima carga — se a página abrir em apresentação sem você pedir, é isso. Limpe antes de testar.
- **Cuidado com `&&` em cadeia no shell.** Um `grep` que não acha nada retorna 1 e **aborta o resto da linha** — já fez um `git rm` seguido de commit não rodar, silenciosamente. Use `;` quando os comandos são independentes.

## Como escrever a mensagem de commit aqui

Este projeto tem uma convenção que vale muito e é fácil de perder: a mensagem documenta o **raciocínio**, não a mudança. Um `git log` deste repositório é a melhor documentação que existe dele — mantenha assim.

Estrutura usada:

1. **Título** curto dizendo o efeito para o usuário, não o arquivo mexido.
2. **O sintoma** que o dono relatou, nas palavras dele quando possível.
3. **A causa raiz**, com o número que a provou e a linha do código.
4. **A correção** e por que essa e não outra.
5. **O que foi verificado**, com os números (geometria, configs testadas, medições).
6. **EM ABERTO**, listando o que ficou pendente e o que é pré-existente vs. novo.

Isso já salvou sessões inteiras: quando uma hipótese registrada em commit se revelou **errada**, foi possível corrigir o rumo porque o raciocínio estava escrito. Se você descobrir que um commit anterior tem uma explicação incorreta, **diga isso explicitamente** no commit novo.

Marcos de retorno existentes (tags no remoto): `antes-otimizacao-video-sede`, `checkpoint-perf-4itens`, `checkpoint-perf-3itens`, `checkpoint-perf-01/02/03`. Ao entregar algo arriscado, crie uma tag antes — é o que dá ao dono a confiança de testar.

## Por que mexer em uma seção é perigoso aqui

Aumentar ou diminuir a altura de uma seção **desloca tudo abaixo dela**. Isso atinge, em cascata:

- **Âncoras do menu** — os alvos são relativos ao elemento, então geralmente se autoajustam; mas o *enquadramento* precisa ser conferido (posição do topo da seção na tela).
- **Pins do ScrollTrigger** — start/end mudam. Se a seção pinada muda de altura, a coreografia inteira muda.
- **Modo apresentação** — as paradas são calculadas a partir dos triggers ou da geometria. Mexer em pin pode fazer uma parada pousar no lugar errado.
- **Snap** — há snap manual na órbita e na sede. Snap somado a auto-scroll já brigou e produziu pingue-pongue visível.
- **Responsividade** — o mobile tem sua própria coreografia, quase sempre mais simples (sem pin). Uma mudança no desktop não vale automaticamente para o mobile, e vice-versa.

Acione o `scroll-guardian` para mapear esse impacto **antes** de mexer. Se o pedido for adicionar ou remover ITEM de uma lista, comece pelo `colecoes-guardian`.

## Armadilhas reais deste projeto

Todas foram descobertas errando. Não repita.

**Medição**
- O `requestAnimationFrame` da janela automatizada roda a **1 fps** quando a janela está ocluída. Sem bombear `gsap.ticker.tick()` num `setInterval(...,14)`, a página **nem termina de inicializar** e a medição mente — já gerou 65 diferenças falsas de geometria.
- Capturar geometria sobre uma página **já usada** por outro teste também mente (33 diffs falsos). Sempre `navigate` limpo.
- Sinal inconfundível de medição inválida: a **contagem de ScrollTriggers cai** (26 → 18/22) e `.jphoto` **muda de tamanho** (202 → 225).
- Comparar triggers **por índice** dá falso positivo se você adicionar/remover um trigger. Compare por identidade (id + pin).
- Detectar avanço da apresentação pelo **rótulo da seção** dá falso positivo: seções com paradas internas mantêm o rótulo. Meça movimento de scroll.

**Scroll e GSAP**
- Eventos de roda **sintéticos não movem** o ScrollSmoother — ele cavalga o scroll nativo. Para simular roda, escreva `window.scrollTo` em passos e deixe o suavizado arrastar atrás.
- Escrever `smoother.scrollTop()` a cada quadro **dessincroniza o smoother**: depois disso ele fica surdo, o `scrollTo` do menu move a barra nativa e o conteúdo não anima. Empurre o **scroll nativo**.
- `tl.progress(1)` **suprime callbacks** no GSAP. Se um `onComplete` dispara algo importante, forçar o progresso pula esse algo silenciosamente.
- Dois disparadores para a mesma timeline com `timeScale` diferentes, guardados pela mesma flag, produzem comportamento **intermitente** — o mesmo gesto dá resultados diferentes.
- Duas mecânicas escrevendo a posição do scroll ao mesmo tempo brigam e a última do quadro ganha. Dê **posse explícita** (ver `autoAte`/`igNavAte` no index).

**Imagens e vídeo**
- `loading="lazy"` **sem `width`/`height`** em imagem cujo container tira a altura dela (`position:absolute` + `img{height:auto}`) cria ciclo vicioso: caixa de altura 0 → o navegador nunca considera perto da tela → nunca carrega → **imagem invisível**, sem erro nenhum. Isso apagou o fundo de moedas dos planos. Declare sempre as dimensões.
- AVIF **lossy destrói alpha**: imagem com transparência ou `mix-blend-mode` vira caixa preta. Use lossless nesses casos.
- Blend modes (`soft-light`, `screen`) em camada de tela cheia sobre vídeo são **caros**: a GPU relê os pixels de baixo, calcula e reescreve a tela toda por quadro. Se o gradiente é estático, **asse no arquivo** com ffmpeg — e use `format=gbrp` antes do `blend`, senão o ffmpeg mistura em YUV e o vídeo sai **magenta**.
- Vídeo controlado por scroll (`currentTime` por quadro) exige keyframe denso. Sem scrub, keyframe denso é desperdício de bytes.

## Comportamento com o dono do projeto

- Explique em português comum, sem jargão. Quando precisar de termo técnico, explique na mesma frase.
- Traga **números** quando eles decidirem algo ("zero diferenças em 177 valores"), não adjetivos.
- Se você errar ou uma hipótese sua cair, **diga**. Já aconteceu várias vezes aqui e a correção honesta valeu mais que a aparência de acerto.
- Se algo ficar sem validação, **liste explicitamente**. Não deixe implícito.
- Nunca peça pra ele decidir algo técnico que você pode medir.
