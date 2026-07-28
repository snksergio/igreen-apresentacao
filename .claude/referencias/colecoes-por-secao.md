# Mapa das coleções, seção por seção

Referência do `colecoes-guardian`. Toda seção desta landing tem uma lista, e cada uma esconde acoplamentos próprios. Contagens medidas em 2026-07-26 — **confirme antes de usar**, elas mudam.

## Como levantar o inventário de qualquer coleção

Antes de mexer, rode isto trocando o seletor. Não presuma o nome: confirme no HTML.

```bash
grep -c 'class="SELETOR' index.html                    # quantos itens hoje
grep -o 'nth-child([0-9]*)' index.html | sort | uniq -c # animação por índice
grep -n '\.g[0-9]{\|SNAPS\|CARO' index.html js/presentation-mode.js   # posição/parada fixa
grep -n "sel:'#SECAO'" -A12 js/presentation-mode.js    # como a apresentação trata a seção
```

O último é o mais importante: mostra se a seção usa `subs`, `buildStops` ou `frame` — e é isso que decide se a quantidade de itens muda o número de paradas.

---

## Trajetória — 6 `.jitem`
Cada item tem `.jcard`, `.jphoto` e `.jspark`. As fotos têm efeito CRT aplicado por JS que envolve a `<img>` (usa `img.closest('picture') || img` — se você trocar por `<picture>`, o efeito precisa continuar achando o elemento certo).

**Apresentação:** usa `trig:'.jwrap'` com `buildStops` que faz **busca binária ao longo do caminho SVG** (`fill.getPointAtLength`) para achar o progresso em que cada ponto aparece. Ou seja: as paradas **derivam do desenho**, não de uma lista fixa. Adicionar um ponto tende a funcionar sozinho — mas **valide**, porque o caminho SVG e o número de itens precisam continuar casados.

Ao adicionar: o ponto no caminho SVG, o `.jitem` correspondente, e a foto tratada (`ativos-guardian`).

## Órbita — 7 `.fc` (cards) + mockup
**O ponto mais delicado do site.** Três acoplamentos:

1. **`SNAPS = [0, .26, .58, .93]`** — as 4 "vistas" da seção, fixas. Adicionar um substep exige acrescentar o valor aqui **e** os limiares de fase no `apply()` (`p-.02-i*.012` para entrada dos cards, `p-.2-i*.02` para saída, `rf` na virada de tela, `df` na fase download). Esses números são calibrados à mão.
2. **Escala em runtime** — `fitOrbita()` calcula o fator a partir da altura disponível, com piso 0.42, e o título acompanha o celular. Mexer no mockup (tamanho, altura do texto) muda esse cálculo. Ver `responsividade-guardian`.
3. **Snap manual** que escreve posição de scroll, com posse compartilhada (`autoAte`). Não crie um terceiro escritor sem respeitar a posse.

Editar o mockup: confira as 3 configs e o piso da escala. Adicionar substep: obrigatoriamente `apresentacao-guardian` depois.

## Ecossistema — 7 `.ecard`
**Um passo de apresentação por card** (`ecoCards()[k]`, `ecoStopIndexFor`). Mudar a quantidade muda o número de paradas e a duração da apresentação inteira.

Há uma constante de duração casada com a animação do deck: `CARO = 5` em `js/presentation-mode.js` (o comentário no código explica: `cp = (progress*D)/CARO_DUR`). Se você mexer no tempo do deck no `index.html`, as paradas por card saem de sincronia.

Cada card aponta para uma `produtos/conexao*.html` — card novo precisa de página nova (base: `produtos/template.html`).

⚠ Avançar por dentro deste stop **navega para a página de produto**. **Isso é INTENCIONAL** — confirmado pelo dono: a apresentação entra no produto de propósito, e quem não quiser usa a navegação **lateral** (direita/esquerda). Não "conserte" isso. Consequência prática: derruba teste automatizado (destrói o contexto), então para testar aquele trecho use as setas laterais ou salte pelos dots.

## Recorrência — 6 `.rblock` + 7 `.rfloat`
Os `.rfloat` têm **posição fixa por índice**: `.g1` a `.g7`, com valores **diferentes** no desktop e dentro de `@media (max-width:1024px)`. Um oitavo card não tem posição e empilha no canto.

No mobile, o palco é escalado (`.recwrap` com altura fixa 1680px + `zoom:.52`) e cada `.rfloat` revela sozinho via `IntersectionObserver` com threshold 0.35 — cuidado: o `.recstage` tem `overflow:hidden`, e o observador conta o clip dos ancestrais. Card cortado pode nunca atingir o threshold e ficar invisível para sempre. **Teste rolando a seção inteira** e confirme que todos chegam a opacidade 1.

## Sede — badges + botão
4 `.hqbadge` visíveis, revelados por cascata de CSS com `nth-child(1)` a `(4)` e `transition-delay` escalonado (~80ms). **Um quinto badge nasce invisível** — a regra do índice 5 não existe. O botão entra por último (`.hqwatch`, delay .62s).

A seção tem folga de pin de `+=75%` (só respiro para o snap encaixar, não coreografa nada) e o vídeo toca em loop com play/pause por visibilidade real.

## Carros, Graduações, Eventos, Planos, Bonificação, Simulador
Não confirmei os seletores destas — **rode o inventário** acima antes de mexer. O que valida para todas:

- **Eventos** ficam num modal construído por JS (`buildEventsModal`), a partir de um array `EVENTS` com uma entrada por evento e uma chave `gal:` que casa com o prefixo dos arquivos em `assets/img/eventos/`. Adicionar evento = entrada no array + fotos nomeadas no padrão `<gal>-1..8` + `<gal>-qrcode`, todas tratadas (`ativos-guardian`). Os masters ficam fora do git.
- **Planos** têm um alternador (mensal/anual) — plano novo precisa dos dois valores, e o card destacado usa `.plan.feat`.
- **Graduações** têm gráfico próprio, com versão 2D simplificada no mobile. Item novo entra nos dois.

Para todas: se a seção aparece em `js/presentation-mode.js` com `subs` ou `buildStops`, a quantidade de itens afeta as paradas. Se aparece com `frame`, não afeta.

---

## Páginas internas — 4 `.cstep` (passo a passo)

São **muito mais simples**: sem pin, sem scrub, sem coreografia pesada. O que importa é outra coisa.

**O que realmente pesa aqui:**

1. **O desenho não pode sair do padrão.** Siga `DESIGN.md`: tokens do `:root`, Inter Display local, verde `#18FF00` com parcimônia, cartões com fundo quase transparente e borda `--line`, cantos generosos, brilho por `box-shadow` de raio grande. Nada de terceiros — nenhuma fonte externa, imagem de banco, CDN ou link de fora.
2. **Seção nova segue o layout existente.** Derive a estrutura das seções que já existem na própria página e dos tokens de acento (`--acc`, `--acc-glow`, `--acc-tint`, `--acc-line`) que dão identidade a cada conexão. Base sempre `produtos/template.html`; **nunca** copie de `produtos/legados/` (arquivos mortos).
3. **Responsividade e escala do monitor** — o ponto mais crítico que já ajustamos. Teste obrigatoriamente nas três: `1920x946x1`, `1536x750x1.25` (o mesmo 1920 com escala 125% do Windows) e `390x844x3`. **Altura é o que aperta**, não largura: algo perfeito em 946 de altura pode estourar em 750. Se não couber, **escale em runtime — não crie breakpoint** (ver `responsividade-guardian`).

**Apresentação nas páginas internas:** o passo a passo é dividido em 2 paradas quando tem 3 ou mais `.cstep` (`buildStops` divide `.cstep` enquadrando pelo `.sec-head`). Passar de 2 para 3 passos **muda o número de paradas**. Valide.

**Ao adicionar passo:** confira se há cascata por `nth-child`, se o texto continua caindo em 2 linhas nas 3 configs, e se as imagens têm `width`/`height` declarados.

---

## Achado da auditoria de imagens (2026-07-26)

Varredura completa: **267 referências de mídia, todas existem no disco** — nenhum caminho quebrado em `index.html`, nas 8 páginas de produto ou no JS.

Das 183 `<img>` da index, percorrendo a página inteira:

- **33 não carregadas mas ocultas** — são as fotos do modal de eventos e da fase download. Carregam quando o modal abre. **Esperado, não é defeito.**
- **12 de 48 tiles do carrossel de logos do clube (órbita) nunca carregam.** São duplicatas do carrossel infinito posicionadas fora da tela na horizontal, e o `loading="lazy"` nunca dispara para elas. Efeito visível: quadrado de 142×142 em branco enquanto o carrossel gira. Arquivos existem (`club-*.avif/webp/png`).
  - **Não é o mesmo bug do fundo de moedas** (ali a caixa tinha altura 0 e a imagem nunca aparecia). Aqui a caixa tem tamanho e o problema é só o disparo do lazy num elemento que vive fora da viewport horizontal.
  - **Conserto quando o dono quiser:** tirar o `loading="lazy"` desses tiles (são pequenos — os avif somam poucas dezenas de kB) ou pré-carregar quando a órbita se aproxima. Custa alguns kB no carregamento e resolve o branco. Decisão de peso é do dono.
- **Nenhuma outra imagem visível deixou de carregar.** As 76 ocorrências de `lazy` sem `width`/`height` **não** estão quebradas hoje — mas continuam sendo a condição que apagou o fundo de moedas, então declare dimensões em imagem nova.
