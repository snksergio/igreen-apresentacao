# 7 Melhorias na Landing iGreen — Plano de Implementação

> **Para quem executa:** validação é **visual via Chrome DevTools MCP** (não há framework de teste).
> **NÃO commitar/subir** — o usuário valida cada tarefa no navegador; commit só com o "ok" dele.
> Steps usam checkbox `- [ ]`.

**Goal:** aplicar 7 melhorias pequenas e independentes (timeline mobile dos produtos, performance de vídeo, sede em loop na apresentação, recorrência mobile, modais de eventos, graduação mobile, menu).

**Arquitetura:** edições aditivas no `index.html`, nas 7 `produtos/conexao*.html` e no `js/presentation-mode.js`. Um utilitário de vídeo compartilhado novo (`js/video-inview.js`).

**Tech:** HTML/CSS inline + JS vanilla + GSAP/ScrollSmoother; IntersectionObserver.

## Global Constraints
- Não commitar nem dar push sem autorização explícita do usuário (produção em teste).
- Zero impacto fora do escopo de cada tarefa. Não mudar animações não relacionadas.
- Validar em: mobile ~390px, notebook 1360×700 e 1707×960, desktop 1920×1080.
- Respeitar `prefers-reduced-motion` onde já é respeitado.

---

### Task 7: Menu — Ecossistema · Simulador · Planos · App

**Files:** Modify `index.html:1826-1832` (`.nav-links` + verificar overlay mobile do menu).

- [ ] **Step 1:** Trocar os 4 links do `.nav-links` para:
```html
<div class="nav-links">
  <a href="#ecossistema">O Ecossistema</a>
  <a href="#simulador">Simulador</a>
  <a href="#planos">Planos</a>
  <a href="#orbita">App</a>
</div>
```
(`#ecossistema` é reescrito p/ `#ecossistema2` pelo script existente em `index.html:3411`.)
- [ ] **Step 2:** Verificar se o overlay do menu mobile reusa `.nav-links` (mesma lista) — se sim, nada extra; senão, replicar.
- [ ] **Step 3 (validação):** DevTools — clicar cada item e confirmar que rola para a seção certa (Ecossistema→deck, Simulador, Planos, App→órbita). Sem itens mortos.

---

### Task 1: Fotos da timeline "Como funciona" no mobile (produtos)

**Files:** Modify (nas 7) `produtos/conexaolivre.html`, `conexaogreen.html`, `conexaoplacas.html`, `conexaosolar.html`, `conexaotelecom.html`, `conexaoseguros.html`, `conexaoexpansao.html` — regra do `.cstep .im` no `@media (max-width:760px)` (em conexaolivre está em `:236-237`).

- [ ] **Step 1:** Ler o bloco `@media (max-width:760px)` de cada arquivo (as linhas variam por página) e localizar `.cstep{grid-template-columns:48px 1fr}` + `.cstep .im{display:none}`.
- [ ] **Step 2:** Substituir por (foto acima do título, menor). O `.cstep` mobile passa a empilhar o conteúdo com a foto no topo via `order`:
```css
@media (max-width:760px){
  .cstep{ grid-template-columns:48px 1fr; }
  /* coluna de conteúdo vira flex-column p/ ordenar a foto acima do título */
  .cstep .tt{ order:2; }
  .cstep p{ order:3; }
  .cstep .im{ display:block; order:1; grid-column:2; margin:0 0 10px;
    width:100%; max-width:220px; aspect-ratio:16/9; }
}
```
> Nota: o `.cstep` é grid `48px 1fr`; `.tt`, `p`, `.im` estão na coluna 2. Para ordenar por `order`, aplicar `display:flex; flex-direction:column` na coluna de conteúdo — se o markup não tiver um wrapper de conteúdo, ordenar diretamente os filhos do grid usando `grid-row` explícito em vez de `order`. Ajustar conforme o markup real de cada arquivo (checar no Step 1).
- [ ] **Step 3:** Ajustar `max-width` da foto (~180–240px) via DevTools até ficar "menor" e proporcional.
- [ ] **Step 4:** Replicar a MESMA regra nas 7 páginas.
- [ ] **Step 5 (validação):** DevTools mobile (390px) em 2–3 produtos — foto aparece acima do título de cada passo, menor, sem quebrar o layout dos passos.

---

### Task 6: Graduação mobile — cards alinhados + sticky maior

**Files:** Modify `index.html` `@media (max-width:1024px)`: `.grad`/`.grads` (`:1761-1771`) e `.sim-stickybar` (`:1776-1785`).

- [ ] **Step 1 (cards uniformes):** No mobile, forçar linhas de altura igual e alinhamento:
```css
#simulador .sel .grads{ grid-template-columns:1fr 1fr; gap:9px; grid-auto-rows:1fr; }
#simulador .sel .grad{ /* ...regras atuais... */ align-content:center; min-height:64px; }
```
(garantir que nomes longos como "Embaixador 12K" não desalinhem — se ainda quebrarem feio, reduzir `.gn` font-size no mobile ou `white-space:nowrap` no `.gn`.)
- [ ] **Step 2 (sticky maior):** Aumentar a altura do `.sim-stickybar`:
```css
.sim-stickybar{ padding:16px 20px calc(16px + env(safe-area-inset-bottom)); }
.sim-stickybar .sb-v{ font-size:23px; }
```
- [ ] **Step 3 (validação):** DevTools mobile — os cards de graduação ficam do mesmo tamanho (grid alinhado); a barra sticky do valor fica visivelmente (mas discretamente) mais alta.

---

### Task 4: Recorrência mobile — respiro + descomprimir

**Files:** Modify `index.html` `@media (max-width:1024px)` (~`:1685-1722`).

- [ ] **Step 1:** Reduzir a compressão da colagem e dar respiro. Valores iniciais (ajustar por DevTools):
```css
.recstage{ height:auto; overflow:hidden; padding:96px 0 40px; }   /* pb 10 -> 40 */
.recwrap{ zoom:.62; height:1180px; max-width:none; }              /* zoom .48 -> ~.62 */
.recgrid{ padding:40px 20px 64px; }                                /* pt 6 -> 40 */
#recorrencia .rectitle2{ margin-top:20px; }                        /* mt 6 -> 20 */
.recblocks{ grid-template-columns:1fr; gap:18px; }                 /* gap 12 -> 18 */
.rblock{ padding:18px 18px; gap:14px; }                            /* respiro interno */
```
- [ ] **Step 2:** Reajustar as posições dos floats `.g1..g7` (`:1704-1710`) para não colidirem com o novo `zoom`/`height` (a colagem fica maior). Iterar no DevTools até os 7 cards + header não se sobreporem.
- [ ] **Step 3 (validação):** DevTools mobile — a colagem (7 cards) tem respiro, o "Seis frentes" fica separado do que vem acima, e os 6 blocos têm espaço entre si. Sem sobreposição do header com os cards.

---

### Task 5: Modais de eventos para todas as graduações

**Files:** Modify `index.html:4958-4963` (array `EVENTS`).

- [ ] **Step 1:** Inserir Sênior (antes de Gestor), Diretor e Acionista (depois de Executivo), na ordem Sênior→Gestor→Executivo→Diretor→Acionista:
```js
var EVENTS=[
  { name:"Sênior",    color:"#22c55e", rgb:"34,197,94",  pin:"assets/pins/SÊNIOR.png",
    logo:'<span class="ev-sm">iGreen</span><span class="ev-lg">TREINAMENTOS</span><span class="ev-tag">& Eventos</span>' },
  { name:"Gestor",    color:"#f97316", rgb:"249,115,22", pin:"assets/pins/GESTOR.png",
    logo:'<span class="ev-sm">iGreen</span><span class="ev-lg">EXPERIENCE</span>' },
  { name:"Executivo", color:"#38bdf8", rgb:"56,189,248", pin:"assets/pins/EXECUTIVO.png",
    logo:'<span class="ev-sm">LET’S GO</span><span class="ev-lg">CRUZEIRO</span><span class="ev-tag">iGreen</span>' },
  { name:"Diretor",   color:"#cbd5e1", rgb:"203,213,225", pin:"assets/pins/DIRETOR.png",
    logo:'<span class="ev-sm">iGreen</span><span class="ev-lg">VIAGEM</span><span class="ev-tag">Internacional</span>' },
  { name:"Acionista", color:"#f5c542", rgb:"245,197,66", pin:"assets/pins/ACIONISTA.png",
    logo:'<span class="ev-sm">iGreen</span><span class="ev-lg">VIAGEM</span><span class="ev-tag">Internacional</span>' }
];
```
> Confirmar no Step 2 os nomes de arquivo exatos das medalhas (o "Ê" pode estar URL-encoded como `S%C3%8ANIOR.png` — usar exatamente como no `DATA` de `index.html:4574-4578`).
- [ ] **Step 2:** Verificar que as medalhas existem em `assets/pins/` e que o path bate (ajustar encoding do "SÊNIOR" se preciso).
- [ ] **Step 3 (validação normal):** Abrir o modal (`#gradEventsBtn`) — 5 dots, navega circular pelos 5, cada slide com nome + medalha certos.
- [ ] **Step 4 (validação apresentação):** No modo apresentação, seção Graduações percorre os 5 eventos (auto-ajusta pelos dots). Testar setas e saída (modal fecha).

---

### Task 2: Vídeos tocam só quando em foco (performance)

**Files:** Create `js/video-inview.js`; Modify `index.html` (incluir `<script>` + marcar/observar vídeos) e as 7 `produtos/conexao*.html` (incluir o script).

- [ ] **Step 1:** Criar `js/video-inview.js` — observador contínuo que toca vídeos visíveis e pausa os fora de tela:
```js
/* Toca <video data-inview> só quando visível; pausa fora da tela (performance).
   Aditivo: não mexe em vídeos com controle próprio (ex.: .carvid one-shot). */
(function(){
  if(!('IntersectionObserver' in window)) return;
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(REDUCE) return; /* já pausados pelo código existente */
  function collect(){ return [].slice.call(document.querySelectorAll('video[data-inview]')); }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      var v = e.target;
      if(e.isIntersecting){ var p=v.play&&v.play(); if(p&&p.catch) p.catch(function(){}); }
      else { try{ v.pause(); }catch(err){} }
    });
  }, { threshold: 0.15 });
  function start(){ collect().forEach(function(v){ io.observe(v); }); }
  if(document.readyState!=='loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
```
- [ ] **Step 2:** No `index.html`, marcar os vídeos de fundo/loop com `data-inview` (via JS, para não editar cada tag): logo antes do include do script, adicionar bloco que seta `data-inview` em `.segv, .pbg, .hqbg, #ecossistema .ecard video, #ecossistema2 .ecard video` — **exceto** `.carvid` (tem one-shot próprio) e **exceto** `.hqbg` no desktop (scrub — só marcar `.hqbg` se mobile). Incluir `<script src="js/video-inview.js">` perto dos outros scripts.
```js
/* marca alvos do video-inview */
(function(){
  var isMobile = matchMedia('(max-width:1024px)').matches;
  document.querySelectorAll('.segv, .pbg, #ecossistema .ecard video, #ecossistema2 .ecard video')
    .forEach(function(v){ v.setAttribute('data-inview',''); });
  if(isMobile){ var hq=document.querySelector('.hqbg'); if(hq) hq.setAttribute('data-inview',''); }
})();
```
> No desktop a `.hqbg` fica de fora (scrub controla). No mobile ela já é loop nativo — o observador só a pausa fora de tela (ganho de performance).
- [ ] **Step 3:** Nas 7 páginas de produto, marcar o vídeo hero `bolt-glass` com `data-inview` (ou por classe) e incluir `<script src="../js/video-inview.js">`.
- [ ] **Step 4 (validação performance):** DevTools → Performance/rendering. Comparar antes/depois no mobile: rolar a index e confirmar que vídeos fora de tela ficam pausados (checar `video.paused` via console para elementos fora da viewport). Confirmar que o carro e o scrub da sede (desktop) seguem funcionando.

---

### Task 3: Vídeo da sede em loop no modo apresentação

**Files:** Modify `js/presentation-mode.js` (config da sede `:65-67`) e `index.html` (gate no scrub `:3313-3316`).

- [ ] **Step 1:** No scrub da sede em `index.html` (`onUpdate` ~`:3313-3316`), adicionar gate no topo do callback:
```js
onUpdate:function(self){
  if(window.__sedePMHold) return;      /* modo apresentação toca em loop: não scrubar */
  var hp=self.progress; if(hqDur){ hqbg.currentTime = hp*(hqDur-.06); }
  /* ...resto do onUpdate como está... */
}
```
- [ ] **Step 2:** Na config da sede em `presentation-mode.js:65-67`, adicionar `onEnter`/`onLeave`:
```js
{ label:'Sede', sel:'#sede', subs:[], on:true,
  dur:function(){ var v=document.querySelector('.hqbg'); var d=(v&&v.duration)?v.duration:9; return clamp(5,16,d); },
  onEnter:function(){ var v=document.querySelector('.hqbg'); if(v){ window.__sedePMHold=true; v.loop=true; try{ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} } },
  onLeave:function(){ var v=document.querySelector('.hqbg'); if(v){ window.__sedePMHold=false; v.loop=false; try{ v.pause(); }catch(e){} } } }
```
- [ ] **Step 3 (validação):** No modo apresentação (desktop), entrar na Sede: vídeo toca em **loop** sozinho sem precisar rolar. Sair (seta/próxima seção): scrub volta a funcionar normalmente no scroll manual. Entrar/sair várias vezes sem travar.

---

## Self-review (cobertura vs spec)
- Tarefas 1–7 ✓ (uma por item da spec). Ordem: 7,1,6,4,5,2,3.
- Sem placeholders de lógica; valores visuais (zoom, max-width, posições) têm valor inicial + método de ajuste (DevTools), que é a forma correta de fechar tuning visual.
- Consistência: flag `window.__sedePMHold` usada igual no gate (Task 3 Step 1) e no onEnter/onLeave (Step 2). Atributo `data-inview` usado igual no `video-inview.js` e nos marcadores (Task 2).

## Handoff
- Sem commit até o "ok" do usuário. Cada tarefa validada no navegador antes de seguir.
