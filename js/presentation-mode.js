/* ==========================================================================
   Modo Apresentação — desktop only
   Etapa 0: ícone/toggle na navbar + rail (dots/setas/play/sair); esconde o menu.
   Etapa 1: motor base (índice de waypoints, sweepTo, goToStop/goToSection,
            serialização, rebuild em refresh) + navegação LIGADA só no
            hero e #resultados. Demais seções ficam com o dot apagado até
            serem habilitadas nas próximas etapas.

   Regras: aditivo, não toca em nada existente; gate rígido de desktop.
   Carregado logo antes de js/page-transition.js.
   ========================================================================== */
(function(){
  'use strict';

  /* ---- gate desktop: espelha o gate do ScrollSmoother (index.html) ---- */
  if (window.matchMedia('(max-width:1024px)').matches) return;

  var root   = document.documentElement;
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GSAP   = window.gsap;
  var ST     = window.ScrollTrigger;
  var SS     = window.ScrollSmoother;

  /* Seções na ordem do DOM.
     - sel: seletor (usar #ecossistema2, o clone VIVO)
     - subs: valores de progress (0..1) dos sub-stops dentro do pin.
             [] = seção "tocável" simples (descansa no fim) ou sem pin (topo).
     - on: habilitada nesta etapa? (rollout section-by-section) */
  var INDEX_SECTIONS = [
    { label:'Início',       sel:'.hero',         subs:[], on:true  },
    { label:'Resultados',   sel:'#resultados',   subs:[], on:true  },
    { label:'Trajetória',   sel:'#trajetoria',   subs:[], on:true,  trig:'.jwrap',
      /* subseções invisíveis: um passo por marco (2021→2026). As setas andam
         marco a marco; o dot continua único. Cada passo para no ponto em que a
         FOTO do ano aparece: mira dotY + max(0, data-off), garantindo card +
         foto revelados (mesma lógica de limiar do jcheck). */
      buildStops:function(st, node){
        if (!st) return null;   // reduced-motion: sem trigger → enquadramento simples
        var fill = node.querySelector('.jfillp');
        var wrap = node.querySelector('.jwrap');
        if (!fill || !wrap || !fill.getTotalLength) return null;
        var len = fill.getTotalLength();
        if (!len) return null;
        var wr = wrap.getBoundingClientRect();
        var span = st.end - st.start;
        var out = [];
        node.querySelectorAll('.jitem').forEach(function(it){
          var dot = it.querySelector('.jdot');
          if (!dot) return;
          var d = dot.getBoundingClientRect();
          var dotY = d.top - wr.top + d.height / 2;
          var ph = it.querySelector('.jphoto');
          var off = ph ? (parseFloat(ph.getAttribute('data-off')) || 0) : 0;
          var targetY = dotY + Math.max(0, off);   // card + foto revelados
          var lo = 0, hi = 1, p = 1;               // busca binária: fillP tip.y >= targetY
          for (var i = 0; i < 22; i++){
            var mid = (lo + hi) / 2;
            if (fill.getPointAtLength(mid * len).y >= targetY){ p = mid; hi = mid; } else { lo = mid; }
          }
          p = Math.min(1, p + 0.05);               // margem além do limiar → foto já disparada
          out.push(st.start + span * p);
        });
        return out.length ? out : null;
      } },
    { label:'Sede',         sel:'#sede',         subs:[], on:true,
      /* modo apresentacao: a sede toca o video em LOOP sozinho enquanto em foco (nao
         depende do scroll). window.__sedePMHold suspende o scrub do currentTime no index. */
      dur:function(){ var v=document.querySelector('.hqbg'); var d=(v&&v.duration)?v.duration:9; return clamp(5,16,d); },
      onEnter:function(){ var v=document.querySelector('.hqbg');
        if(v){ window.__sedePMHold=true; try{ v.loop=true; v.currentTime=0; var p=v.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} } },
      onLeave:function(){ var v=document.querySelector('.hqbg');
        window.__sedePMHold=false; if(v){ try{ v.loop=false; v.pause(); }catch(e){} } } },
    { label:'Ecossistema',  sel:'#ecossistema2', subs:[], on:true,
      /* baralho: um passo por card em foco (como a trajetória). O card i fica em
         foco quando cp = i/(N-1); e cp = (progress*D)/CARO_DUR, com CARO_DUR=5 e
         D = duração da deckTL (exposta pelo próprio trigger em st.animation). */
      buildStops:function(st, node){
        if (!st) return null;   // reduced-motion: sem trigger → enquadramento simples
        var cards = node.querySelectorAll('.ecard');
        var N = cards.length;
        if (!N) return null;
        var D = (st.animation && st.animation.duration) ? st.animation.duration() : 10.4;
        var CARO = 5, span = st.end - st.start, out = [];
        for (var i = 0; i < N; i++){
          var cp = (N > 1) ? i / (N - 1) : 0;
          var p = Math.min(1, (CARO * cp) / D);
          out.push(st.start + span * p);
        }
        return out;
      } },
    { label:'Órbita',       sel:'#orbita',       subs:[0.19, 0.58, 0.93], on:true,
      /* 3 views compostas = SNAPS[1..3] (celular/app, tela do clube, download);
         o 0 é só a entrada crua. Ao ir pela seta (varredura contínua) a ponte
         eco2→órbita dispara o igStartOrbita; ao ir pelo dot (teleporte) a ponte
         é pulada, então disparamos o intro na mão e garantimos smoother ativo. */
      /* entrada pela seta é LENTA: cobre o colapso dos cards no núcleo + a descida
         até o celular (era rápido demais pra ver). Não afeta os passos internos. */
      enterDur:6,
      onEnter:function(){
        try{ var s=(window.ScrollSmoother&&ScrollSmoother.get)?ScrollSmoother.get():null; if(s) s.paused(false); }catch(e){}
        if (window.igStartOrbita) window.igStartOrbita();
      } },
    { label:'Recorrência',  sel:'#recorrencia',  subs:[], on:true,
      /* transições mais suaves (entrada e beat1↔beat2) */
      dur:2.6,
      /* 2 subcategorias: (1) texto central + cards convergindo (fim do scrub radial,
         ainda no pin); (2) grid "Seis frentes, uma recorrência" enquadrado. Enquadra
         o grid por geometria em vez de usar o fim do reveal (que ia parar na bonificação). */
      buildStops:function(st, node){
        if (!st) return null;   // reduced-motion: sem trigger → enquadramento simples
        var stage = node.querySelector('.recstage');
        var grid  = node.querySelector('.recgrid');
        var all = sectionTriggers({}, node), radial = null;
        for (var i = 0; i < all.length; i++){ if (all[i].trigger === stage && !all[i].pin){ radial = all[i]; break; } }
        var out = [];
        out.push(radial ? (radial.start + (radial.end - radial.start) * 0.98) : st.end);   // beat 1
        if (grid){
          var r = grid.getBoundingClientRect(), vh = window.innerHeight;
          var off = Math.max(80, (vh - r.height) / 2);
          out.push(curY() + r.top - off);                                                  // beat 2
        }
        return out;
      } },
    { label:'Bonificação',  sel:'#bonificacao',  subs:[], on:true,
      /* seção de enquadramento (sem scrub): o vídeo dos carros toca sozinho ao
         entrar. Pelo dot (teleporte) o reveal once pode não disparar, então damos
         play na mão; ao terminar, o próprio site revela as abas de carro. */
      /* telas altas: sobe um pouco (-72). telas baixas (notebook ~700-768px): 0,
         senão o título encavala na navbar. */
      frameOff:function(){ return window.innerHeight < 900 ? 0 : -72; },
      onEnter:function(){ var v=document.querySelector('.carvid'); if (v){ var p=v.play(); if (p&&p.catch) p.catch(function(){}); } },
      /* 2 passos na mesma posição: (1) enquadra (BYD Royal 5K é o padrão); (2) troca
         para o Porsche Taycan (Embaixador 12K). Volta ao passo 1 reverte pro BYD. */
      buildStops:function(st, node){
        var off = (typeof this.frameOff === 'function') ? this.frameOff() : (this.frameOff != null ? this.frameOff : 90);
        var y = curY() + node.getBoundingClientRect().top - off;
        return [
          { y:y, action:function(){ if (document.body.classList.contains('cars-ready')) carSelectRaw(0); } },
          { y:y, action:function(){ carSelect(1); } }
        ];
      } },
    { label:'Simulador',    sel:'#simulador',    subs:[], on:true, frame:true,
      /* enquadra o cabeçalho do simulador (evita o vazio grande no topo) */
      buildStops:function(st, node){
        var head = node.querySelector('.sim-head') || node;
        return [ curY() + head.getBoundingClientRect().top - 88 ];
      } },
    { label:'Graduações',   sel:'#graduacoes',   subs:[], on:true, trig:'#gradSection', dur:2.8,
      onLeave:function(){ gradEventsClose(); gradClear(); },
      /* 1º passo: gráfico completo. Depois um passo por barra (hover do nível).
         Por fim, abre o modal "Nossos Eventos" e navega os slides — tudo na mesma
         posição de scroll, com as mesmas setas; fecha ao sair da seção. */
      buildStops:function(st, node){
        if (!st) return null;   // reduced-motion: sem trigger → enquadramento simples
        var y = st.start + (st.end - st.start) * 0.9;
        var bs = document.querySelectorAll('#gradBars .bar-group');
        var out = [{ y:y, action:function(){ gradEventsClose(); gradClear(); } }];   // gráfico completo
        for (var i = bs.length - 1; i >= 0; i--){                                    // Sênior → ... → Acionista
          (function(idx){ out.push({ y:y, action:function(){ gradEventsClose(); gradHover(idx); } }); })(i);
        }
        var dots = document.querySelectorAll('#gradEventsModal .gm-dot');            // "Nossos Eventos": 1 passo por slide
        for (var j = 0; j < dots.length; j++){
          (function(slide){ out.push({ y:y, action:function(){ gradClear(); gradEventsOpen(); gradEventGo(slide); } }); })(j);
        }
        return out;
      } },
    { label:'Planos',       sel:'#planos',       subs:[], on:true,
      /* sub-steps (os cards são altos e não cabem juntos): (1) título + plano 1;
         (2) plano 2 enquadrado; (3) footer (#rodape). Sem pin/scrub → geometria. */
      buildStops:function(st, node){
        var head = node.querySelector('.pl-head');
        var plans = node.querySelectorAll('.pl-list .plan');
        var footer = document.getElementById('rodape');
        var vh = window.innerHeight, base = curY(), out = [];
        var ref1 = head || plans[0];
        var off1 = (window.innerHeight < 900) ? 60 : 240;                          // telas baixas: menos offset (sem vazio)
        if (ref1) out.push(base + ref1.getBoundingClientRect().top - off1);         // título + plano 1
        if (plans[1]){
          var r2 = plans[1].getBoundingClientRect();
          out.push(base + r2.top - Math.max(80, (vh - r2.height) / 2));            // plano 2
        }
        if (footer){
          var rf = footer.getBoundingClientRect();
          out.push(base + rf.top - Math.max(60, (vh - rf.height) / 2));            // footer (clamp leva ao fim)
        }
        return out.length ? out : null;
      } }
  ];

  /* ----- config por página -----
     index.html: sem window.PMODE → usa INDEX_SECTIONS (mapa rico, com pin/scrub).
     páginas de produto: definem window.PMODE = { auto:true, backHref:'../index.html' }
     antes deste script; as seções são auto-detectadas (header.hero + <section>),
     cada uma vira um stop simples de enquadramento (scroll nativo, sem GSAP). */
  var PM   = window.PMODE || {};
  var AUTO = !!PM.auto;
  /* produto em apresentação: limpa o restore de scroll da visita anterior ANTES do
     page-transition rodar (este script carrega antes dele) — assim a página não é
     deslocada na chegada; a apresentação sempre começa no hero. */
  if (AUTO){ try{ if (sessionStorage.getItem('pm') === '1') sessionStorage.removeItem('pt-scroll:' + location.pathname); }catch(e){} }
  function buildAutoSections(){
    var sel = PM.screens || 'header.hero, section';
    var seen = [];
    [].slice.call(document.querySelectorAll(sel)).forEach(function(s){ if (seen.indexOf(s) === -1) seen.push(s); });
    return seen.map(function(s, i){
      var lbl = s.getAttribute('data-pm-label');
      if (!lbl){ var h = s.querySelector('h1, h2, .kicker'); lbl = h ? h.textContent : (s.id || ('Seção ' + (i + 1))); }
      lbl = (lbl || '').replace(/\s+/g, ' ').trim().slice(0, 22) || ('Seção ' + (i + 1));
      return { label: lbl, el: s, subs: [], on: true, frame: true, frameOff: (PM.frameOff != null ? PM.frameOff : 80) };
    });
  }
  var SECTIONS = AUTO ? buildAutoSections() : INDEX_SECTIONS;

  /* ---- ícones (SVG inline) ---- */
  var ICON_PRESENT =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect class="pm-frame" x="2.5" y="4.5" width="19" height="13" rx="2.2" fill="none" stroke-width="1.6"/>' +
      '<path class="pm-play" d="M10 8.6v6l5-3z"/>' +
      '<line class="pm-frame" x1="8" y1="20.5" x2="16" y2="20.5" stroke-width="1.6"/>' +
    '</svg>';
  var ICON_EXIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var ICON_UP   = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 15 12 9 18 15"/></svg>';
  var ICON_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_PLAY = '<span class="pm-playicon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6l10 6-10 6z" fill="currentColor" stroke="none"/></svg></span>' +
                  '<span class="pm-pauseicon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="3.4" height="12" fill="currentColor" stroke="none"/><rect x="13.6" y="6" width="3.4" height="12" fill="currentColor" stroke="none"/></svg></span>';

  /* ---- helpers ---- */
  function el(tag, cls, html){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function sm(){ return (SS && SS.get) ? SS.get() : null; }
  function curY(){ var s = sm(); return s ? s.scrollTop() : (window.pageYOffset || 0); }
  function setY(y){ var s = sm(); if (s) s.scrollTop(y); else window.scrollTo(0, y); if (ST) ST.update(); }
  function maxY(){ return ST ? ST.maxScroll(window) : Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function clamp(a, b, v){ return v < a ? a : (v > b ? b : v); }

  /* graduações: activate/deactivate do hover são locais ao app; disparamos os
     eventos que os próprios elementos das barras escutam (pointerenter/leave). */
  function gradBarEls(){ var r = document.getElementById('gradBars'); return r ? [].slice.call(r.querySelectorAll('.bar-group')) : []; }
  function gradClear(){ gradBarEls().forEach(function(g){ try{ g.dispatchEvent(new PointerEvent('pointerleave', {bubbles:true})); }catch(e){} }); }
  function gradHover(i){ var bs = gradBarEls(); if (!bs.length) return; gradClear(); if (bs[i]){ try{ bs[i].dispatchEvent(new PointerEvent('pointerenter', {bubbles:true})); }catch(e){} } }

  /* modal "Nossos Eventos" das graduações: abrir/fechar e navegar os slides pelos
     próprios controles do site (o modal já tem navegação horizontal). */
  function gradModalEl(){ return document.getElementById('gradEventsModal'); }
  function gradEventsOpen(){ var m = gradModalEl(); if (m && m.classList.contains('open')) return; var b = document.getElementById('gradEventsBtn'); if (b) try{ b.click(); }catch(e){} }
  function gradEventsClose(){ var m = gradModalEl(); if (m && m.classList.contains('open')){ var c = m.querySelector('.gm-close'); if (c) try{ c.click(); }catch(e){} } }
  function gradEventGo(i){ var d = document.querySelector('#gradEventsModal .gm-dot[data-i="' + i + '"]'); if (d) try{ d.click(); }catch(e){} }

  /* bonificação: seleciona o carro/aba (clicar no .carbtn dispara o setCar do site) */
  function carSelectRaw(i){ var b = document.querySelector('.carbtn[data-car="' + i + '"]'); if (b) try{ b.click(); }catch(e){} }
  function carSelect(i){
    // se o vídeo ainda estiver rodando, força o estado final (abas de carro visíveis)
    if (!document.body.classList.contains('cars-ready')){
      var v = document.querySelector('.carvid'); if (v) try{ v.dispatchEvent(new Event('ended')); }catch(e){}
    }
    carSelectRaw(i);
  }

  /* ==========================================================================
     UI
     ========================================================================== */

  /* 1) botão toggle na navbar (ao lado do CTA / antes do hambúrguer) */
  var toggle = el('button', 'pmode-toggle', ICON_PRESENT);
  toggle.type = 'button';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-label', 'Ativar modo apresentação');
  toggle.title = 'Modo apresentação';

  // index: agrupa o toggle + "Fale conosco" (toggle ANTES do CTA, juntinhos).
  // produtos (AUTO): não injeta toggle na navbar — a página entra em apresentação
  // sozinha (auto-enter) e o "sair" do rail volta pro index.
  if (!AUTO){
    var navCta = document.querySelector('.nav .nav-cta');
    if (navCta && navCta.parentNode){
      var ctaGroup = el('div', 'pmode-cta-group');
      navCta.parentNode.insertBefore(ctaGroup, navCta);
      ctaGroup.appendChild(toggle);
      ctaGroup.appendChild(navCta);
    } else {
      var navShell = document.querySelector('.nav .nav-shell');
      if (navShell) navShell.appendChild(toggle);
    }
  }

  /* 2) rail à esquerda (irmão da <nav>, fora do #smooth-content) */
  var rail = el('nav', 'pmode-rail');
  rail.setAttribute('aria-label', 'Navegação da apresentação');

  var btnExit = el('button', 'pmode-ctrl pmode-exit', ICON_EXIT);
  btnExit.type = 'button'; btnExit.setAttribute('aria-label', 'Sair do modo apresentação'); btnExit.title = 'Sair (Esc)';

  var btnUp = el('button', 'pmode-ctrl pmode-up', ICON_UP);
  btnUp.type = 'button'; btnUp.setAttribute('aria-label', 'Passo anterior');

  var btnDown = el('button', 'pmode-ctrl pmode-down', ICON_DOWN);
  btnDown.type = 'button'; btnDown.setAttribute('aria-label', 'Próximo passo');

  var btnPlay = el('button', 'pmode-ctrl pmode-play', ICON_PLAY);
  btnPlay.type = 'button'; btnPlay.setAttribute('aria-pressed', 'false');
  btnPlay.setAttribute('aria-label', 'Reproduzir automaticamente'); btnPlay.title = 'Auto (play)';

  var dotsList = el('ol', 'pmode-dots'); dotsList.setAttribute('role', 'list');
  var dots = SECTIONS.map(function(s, i){
    var li = el('li');
    var d = el('button', 'pmode-dot', '<span class="sr-only">' + s.label + '</span>');
    d.type = 'button';
    d.setAttribute('data-section', String(i));
    d.setAttribute('data-label', s.label);
    d.setAttribute('aria-label', 'Ir para ' + s.label);
    d.setAttribute('aria-current', 'false');
    li.appendChild(d); dotsList.appendChild(li);
    return d;
  });

  rail.appendChild(btnExit);
  rail.appendChild(el('span', 'pmode-sep'));
  rail.appendChild(btnUp);
  rail.appendChild(dotsList);
  rail.appendChild(btnDown);
  rail.appendChild(el('span', 'pmode-sep'));
  rail.appendChild(btnPlay);
  document.body.appendChild(rail);

  /* telas menores: rail recolhido que abre ao aproximar o mouse da lateral (ou foco).
     Em telas grandes o CSS mantém o rail completo, então isto é inócuo lá. */
  var railZone = el('div', 'pmode-railzone');
  document.body.appendChild(railZone);
  var railCloseT = null;
  function railOpen(){ if (railCloseT){ clearTimeout(railCloseT); railCloseT = null; } rail.classList.add('pmode-rail-open'); }
  function railClose(){ if (railCloseT) clearTimeout(railCloseT); railCloseT = setTimeout(function(){ rail.classList.remove('pmode-rail-open'); }, 280); }
  railZone.addEventListener('mouseenter', railOpen);
  rail.addEventListener('mouseenter', railOpen);
  railZone.addEventListener('mouseleave', railClose);
  rail.addEventListener('mouseleave', railClose);
  rail.addEventListener('focusin', railOpen);
  rail.addEventListener('focusout', railClose);

  /* ==========================================================================
     Motor de waypoints
     ========================================================================== */
  var built = false;
  var sections = [];       // paralelo a SECTIONS: { si, el, on, startY, stops:[y..] }
  var activeStops = [];    // lista plana ordenada: { y, si, sub, first }
  var curIdx = -1;
  var activeTween = null;

  /* acha o ScrollTrigger que representa a transição da seção (pinado OU scrub).
     Prioriza o elemento explícito sc.trig; senão qualquer trigger contido na seção.
     Entre candidatos, prefere pinado; senão o de maior range (o scrub principal). */
  function sectionTriggers(sc, node){
    if (!ST) return [];
    var all = ST.getAll();
    var trigNode = sc.trig ? document.querySelector(sc.trig) : null;
    var pool = [];
    if (trigNode) pool = all.filter(function(t){ return t.trigger === trigNode; });
    if (!pool.length && node) pool = all.filter(function(t){
      return t.trigger && (t.trigger === node || node.contains(t.trigger) || t.trigger.contains(node));
    });
    return pool;
  }
  function findTrigger(sc, node){
    // só triggers "varreáveis" (pin ou scrub). Reveals once — mesmo com end grande
    // 'bottom top' — NÃO contam: senão parariam com a seção já rolada pra fora.
    var pool = sectionTriggers(sc, node).filter(function(t){ return t.pin || (t.vars && t.vars.scrub); });
    if (!pool.length) return null;
    var pinned = pool.filter(function(t){ return t.pin; });
    var use = pinned.length ? pinned : pool;
    use.sort(function(a, b){ return (b.end - b.start) - (a.end - a.start); });
    return use[0];
  }

  function rebuildIndex(){
    built = true;
    sections = [];
    activeStops = [];

    SECTIONS.forEach(function(sc, si){
      var node = sc.el || document.querySelector(sc.sel);
      var entry = { si:si, el:node, on: !!(sc.on && node), startY:0, stops:[] };
      if (entry.on){
        // sc.frame força enquadramento (ignora pin/scrub) — p/ seções interativas
        var st = sc.frame ? null : findTrigger(sc, node);
        // buildStops roda com OU sem trigger (ex.: planos, sem pin, usa geometria)
        var custom = sc.buildStops ? sc.buildStops(st, node) : null;
        if (custom && custom.length){
          // cada item pode ser um número (y) ou {y, action} (ação ao chegar no stop)
          entry.stops   = custom.map(function(s){ return clamp(0, maxY(), (s && typeof s === 'object') ? s.y : s); });
          entry.actions = custom.map(function(s){ return (s && typeof s === 'object') ? s.action : null; });
          entry.startY = st ? clamp(0, maxY(), st.start) : entry.stops[0];
        } else if (st){
          var s0 = st.start, s1 = st.end;
          if (sc.union){   // varre a união dos ranges de todos os triggers da seção
            var trs = sectionTriggers(sc, node);
            s0 = Math.min.apply(null, trs.map(function(t){ return t.start; }));
            s1 = Math.max.apply(null, trs.map(function(t){ return t.end; }));
          }
          entry.startY = clamp(0, maxY(), s0);
          if (sc.subs && sc.subs.length){
            entry.stops = sc.subs.map(function(p){ return clamp(0, maxY(), s0 + (s1 - s0) * p); });
          } else {
            entry.stops = [ clamp(0, maxY(), s1) ];   // tocável: descansa no fim
          }
        } else {
          // sem pin → enquadra o topo. frameOff = quanto o topo da seção fica abaixo
          // do topo da viewport (menor/negativo = rola mais para baixo).
          var foff = (sc.frameOff != null) ? (typeof sc.frameOff === 'function' ? sc.frameOff() : sc.frameOff) : 90;
          var top = curY() + node.getBoundingClientRect().top - foff;
          entry.startY = clamp(0, maxY(), top);
          entry.stops = [ entry.startY ];
        }
      }
      sections[si] = entry;
    });

    sections.forEach(function(entry){
      if (!entry.on) return;
      entry.stops.forEach(function(y, k){
        activeStops.push({ y:y, si:entry.si, sub:k, first:(k === 0),
          action:(entry.actions ? entry.actions[k] : null) });
      });
    });
    activeStops.sort(function(a, b){ return a.y - b.y; });

    renderDotsState();
  }

  function nearestIdx(){
    if (!activeStops.length) return -1;
    var y = curY(), best = 0, bd = Infinity;
    activeStops.forEach(function(s, i){ var dd = Math.abs(s.y - y); if (dd < bd){ bd = dd; best = i; } });
    return best;
  }

  /* tween nativo (rAF) p/ páginas sem GSAP (produtos) — mantém suavidade + onComplete */
  function sweepNative(fromY, targetY, dur){
    return new Promise(function(res){
      var start = null, cancelled = false;
      var ease = function(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }; // ~power3.inOut
      activeTween = { kill:function(){ cancelled = true; activeTween = null; } };
      function step(ts){
        if (cancelled) return;
        if (start == null) start = ts;
        var t = Math.min(1, (ts - start) / (dur * 1000));
        setY(fromY + (targetY - fromY) * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else { activeTween = null; res(); }
      }
      requestAnimationFrame(step);
    });
  }

  function sweepTo(targetY, durOverride, easeOverride){
    targetY = clamp(0, maxY(), targetY);
    if (REDUCE){ setY(targetY); return Promise.resolve(); }
    var fromY = curY();
    var dist = Math.abs(targetY - fromY);
    if (dist < 2){ setY(targetY); return Promise.resolve(); }
    if (!GSAP) return sweepNative(fromY, targetY, durOverride ? Math.max(0.4, durOverride) : clamp(0.6, 1.4, dist / 2200));
    /* piso alto de duração + ease forte: trechos curtos ficam gentis (não bruscos);
       trechos longos não passam de ~1.7s. durOverride (ex.: sede) força um tempo
       próprio; easeOverride (ex.: entrada da órbita) deixa o ritmo mais uniforme. */
    var dur = durOverride ? Math.max(0.4, durOverride) : clamp(0.85, 1.7, dist / 2000);
    var pr = { v: fromY };
    return new Promise(function(res){
      activeTween = GSAP.to(pr, {
        v: targetY, duration: dur, ease: easeOverride || 'power3.inOut', overwrite: true,
        onUpdate: function(){ setY(pr.v); },
        onComplete: function(){ activeTween = null; res(); },
        onInterrupt: function(){ activeTween = null; res(); }
      });
    });
  }

  /* reposition=true  → salta pro início da seção e anima até o passo (uso do DOT)
     reposition=false → varredura contínua e suave da posição atual até o alvo (SETAS) */
  function goToIndex(idx, reposition){
    if (activeTween) return Promise.resolve();   // serializa: 1 varredura por vez
    if (!built) rebuildIndex();
    if (!activeStops.length) return Promise.resolve();
    idx = clamp(0, activeStops.length - 1, idx);
    var prevSi = (curIdx >= 0 && activeStops[curIdx]) ? activeStops[curIdx].si : -1;
    var stop = activeStops[idx];
    var entry = sections[stop.si];
    var sc = SECTIONS[stop.si];
    // entrando numa seção nova pela seta (varredura contínua) → usa enterDur se houver;
    // senão a duração normal da seção (sc.dur) ou o cálculo por distância.
    var enteringNew = stop.first && stop.si !== prevSi && !reposition;
    var durOv, easeOv;
    if (enteringNew && sc && sc.enterDur != null){
      durOv = (typeof sc.enterDur === 'function') ? sc.enterDur() : sc.enterDur;
      easeOv = 'power1.inOut';   // entrada longa: ritmo uniforme (não acelera no meio)
    } else {
      durOv = (sc && typeof sc.dur === 'function') ? sc.dur() : ((sc && sc.dur) || 0);
    }
    // saindo de uma seção → hook de limpeza (ex.: graduações limpa o hover ativo)
    if (prevSi >= 0 && prevSi !== stop.si && SECTIONS[prevSi] && typeof SECTIONS[prevSi].onLeave === 'function') SECTIONS[prevSi].onLeave();

    curIdx = idx;
    renderDotsState();

    return new Promise(function(resolve){
      var done = function(){ renderDotsState(); if (typeof stop.action === 'function') stop.action(); resolve(); };
      if (reposition && stop.first && entry && Math.abs(curY() - entry.startY) > 4){
        // salta pro começo da seção e então anima a transição até o passo
        setY(entry.startY);
        if (sc && typeof sc.onEnter === 'function') sc.onEnter();
        requestAnimationFrame(function(){ sweepTo(stop.y, durOv, easeOv).then(done); });
      } else {
        // scroll suave direto — sem teleporte (voltar/continuar com as setas)
        sweepTo(stop.y, durOv, easeOv).then(done);
      }
    });
  }

  function firstStopIndexOf(si){
    for (var i = 0; i < activeStops.length; i++) if (activeStops[i].si === si && activeStops[i].first) return i;
    return -1;
  }
  function goToSection(si){ var i = firstStopIndexOf(si); return (i >= 0) ? goToIndex(i, true) : Promise.resolve(); }

  var liveRegion = null, lastAnnounced = -1;
  function renderDotsState(){
    var activeSi = (curIdx >= 0 && activeStops[curIdx]) ? activeStops[curIdx].si : -1;
    dots.forEach(function(d, i){
      var on = !!(sections[i] && sections[i].on);
      d.disabled = !on;
      d.classList.toggle('is-disabled', !on);
      d.classList.toggle('is-active', i === activeSi);
      d.setAttribute('aria-current', i === activeSi ? 'true' : 'false');
      if (on && activeSi >= 0 && i < activeSi) d.classList.add('is-visited');
    });
    if (liveRegion && activeSi >= 0 && activeSi !== lastAnnounced){
      lastAnnounced = activeSi; liveRegion.textContent = SECTIONS[activeSi].label;
    }
  }

  /* rebuild quando o layout muda (fonts/mídia/resize) — start/end em px mudam */
  if (ST) ST.addEventListener('refresh', function(){ if (built) rebuildIndex(); });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e){
    REDUCE = e.matches; if (built) rebuildIndex();
  });

  /* ==========================================================================
     Ativação / saída + auto-play + captura de input
     ========================================================================== */
  var active = false;
  var autoOn = false, autoTimer = null;
  var AUTO_DWELL = 1400;   // pausa entre passos durante o auto-play

  /* região aria-live para leitores de tela anunciarem a seção atual */
  liveRegion = el('div', 'sr-only'); liveRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(liveRegion);

  function stopAuto(){
    if (autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
    if (autoOn){ autoOn = false; btnPlay.classList.remove('is-playing'); btnPlay.setAttribute('aria-pressed', 'false'); }
  }
  function autoStep(){
    autoTimer = null;
    if (!autoOn) return;
    if (curIdx >= activeStops.length - 1){ stopAuto(); return; }   // chegou ao fim → para
    goToIndex(curIdx + 1, false).then(function(){
      if (!autoOn) return;
      autoTimer = setTimeout(autoStep, AUTO_DWELL);                // segue sozinho até o fim
    });
  }
  function startAuto(){
    if (autoOn || activeTween) return;
    if (curIdx >= activeStops.length - 1) return;                  // já no fim
    autoOn = true; btnPlay.classList.add('is-playing'); btnPlay.setAttribute('aria-pressed', 'true');
    autoStep();
  }

  /* navegação manual = para o auto-play ao interagir */
  function manualIndex(idx){ stopAuto(); goToIndex(idx, false); }
  function manualSection(si){ stopAuto(); goToSection(si); }

  function enter(){
    if (active) return;
    active = true;
    if (AUTO) root.style.scrollBehavior = 'auto';   // rAF controla o scroll (sem CSS smooth brigando)
    root.classList.add('pmode-active');
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', 'Sair do modo apresentação');
    if (!built) rebuildIndex();
    curIdx = nearestIdx();
    renderDotsState();
    try { btnDown.focus(); } catch(e){}
  }
  function exit(){
    if (!active) return;
    active = false;
    stopAuto();
    tourSet(false);      // sair encerra o tour do ecossistema
    try{ sessionStorage.removeItem('pm'); }catch(e){}
    gradEventsClose();   // se saiu com o modal "Nossos Eventos" aberto, fecha (despausa o smoother)
    if (activeTween){ activeTween.kill(); activeTween = null; }
    root.classList.remove('pmode-active');
    if (AUTO) root.style.scrollBehavior = '';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Ativar modo apresentação');
    try { toggle.focus(); } catch(e){}
  }
  /* produto: "sair" = voltar pro index (reusa o link .back / data-pt-href → cortina) */
  function goBack(){
    var back = document.querySelector('.nav .back, [data-pt-href$="index.html"]');
    if (back){ back.click(); return; }
    try{ sessionStorage.setItem('pt', '1'); }catch(e){}
    location.href = PM.backHref || '../index.html';
  }

  /* ===== Tour do ecossistema =====
     No ecossistema (index), ↓ ABRE o produto do card atual (sem clique). Ao terminar
     de percorrer o produto (↓ no último passo dele), ele volta pra home focando o
     PRÓXIMO card; após o último card, segue pra órbita. Estado em sessionStorage
     (pmtour/pmcard) sobrevive à navegação. */
  function isEcoCardStop(idx){ var s=activeStops[idx]; return !!(s && SECTIONS[s.si] && SECTIONS[s.si].sel==='#ecossistema2'); }
  function ecoCards(){ return document.querySelectorAll('#ecossistema2 .ecard'); }
  function ecoStopIndexFor(k){ for (var i=0;i<activeStops.length;i++){ var s=activeStops[i]; if (SECTIONS[s.si] && SECTIONS[s.si].sel==='#ecossistema2' && s.sub===k) return i; } return -1; }
  function tourOn(){ try{ return sessionStorage.getItem('pmtour')==='1'; }catch(e){ return false; } }
  function tourCard(){ try{ return parseInt(sessionStorage.getItem('pmcard')||'-1',10); }catch(e){ return -1; } }
  function tourSet(on, card){ try{ if(on){ sessionStorage.setItem('pmtour','1'); sessionStorage.setItem('pmcard',String(card)); } else { sessionStorage.removeItem('pmtour'); sessionStorage.removeItem('pmcard'); } }catch(e){} }

  function openEcoCard(k){
    var card = ecoCards()[k]; if (!card){ goToIndex(curIdx+1, false); return; }
    tourSet(true, k);
    try{ sessionStorage.setItem('pm','1'); sessionStorage.setItem('pm-stop', String(curIdx)); }catch(e){}
    card.click();   // page-transition navega com a cortina
  }
  function goToEcoCard(k){ var i=ecoStopIndexFor(k); if (i>=0) goToIndex(i, false); }

  /* "próximo" central: no ecossistema abre o produto; no produto (tour) o ↓ no fim
     avança pro próximo card; senão comportamento normal de passo. */
  function goNext(){
    stopAuto();
    if (activeTween) return;
    if (AUTO){
      if (tourOn() && curIdx >= activeStops.length - 1){
        tourSet(true, tourCard() + 1);
        try{ sessionStorage.setItem('pm','1'); }catch(e){}
        goBack();
        return;
      }
      goToIndex(curIdx + 1, false); return;
    }
    if (curIdx >= 0 && isEcoCardStop(curIdx)){ openEcoCard(activeStops[curIdx].sub); return; }
    goToIndex(curIdx < 0 ? 0 : curIdx + 1, false);
  }
  function goPrev(){ stopAuto(); goToIndex(curIdx <= 0 ? 0 : curIdx - 1, false); }

  /* passo "puro" (setas < >): NUNCA abre produto — no ecossistema troca de card e,
     no último, segue pra próxima seção (órbita). Fora do ecossistema = passo normal. */
  function goStepNext(){ stopAuto(); if (activeTween) return; goToIndex(curIdx < 0 ? 0 : curIdx + 1, false); }

  /* produto: fechar E PULAR pro próximo card (no tour); fora do tour só volta */
  function skipProduct(){
    if (tourOn()) tourSet(true, tourCard() + 1);
    try{ sessionStorage.setItem('pm', '1'); }catch(e){}
    goBack();
  }

  /* ---- controles ---- */
  dots.forEach(function(d, i){
    d.addEventListener('click', function(){ if (SECTIONS[i].on) manualSection(i); });
  });
  btnUp.addEventListener('click', function(){ goPrev(); });
  btnDown.addEventListener('click', function(){ goNext(); });
  btnPlay.addEventListener('click', function(){ autoOn ? stopAuto() : startAuto(); });
  toggle.addEventListener('click', function(){ active ? exit() : enter(); });
  btnExit.addEventListener('click', function(){ AUTO ? skipProduct() : exit(); });

  /* ---- teclado (só no modo ativo) ---- */
  document.addEventListener('keydown', function(e){
    if (!active) return;
    var k = e.key;
    if (k === 'Escape' || e.keyCode === 27){ e.preventDefault(); AUTO ? skipProduct() : exit(); }
    else if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar'){ e.preventDefault(); goNext(); }
    else if (k === 'ArrowUp' || k === 'PageUp'){ e.preventDefault(); goPrev(); }
    else if (k === 'ArrowRight'){ e.preventDefault(); goStepNext(); }   // troca card sem abrir; no último → próxima seção
    else if (k === 'ArrowLeft'){ e.preventDefault(); goPrev(); }        // card anterior sem abrir
    else if (k === 'Home'){ e.preventDefault(); manualIndex(0); }
    else if (k === 'End'){ e.preventDefault(); manualIndex(activeStops.length - 1); }
  }, true);

  /* ---- captura da roda do mouse: cada gesto = um passo (sem scroll livre) ---- */
  var wheelLock = false;
  window.addEventListener('wheel', function(e){
    if (!active) return;
    e.preventDefault();                       // bloqueia o scroll livre no modo apresentação
    if (activeTween || wheelLock || Math.abs(e.deltaY) < 4) return;
    wheelLock = true; setTimeout(function(){ wheelLock = false; }, 320);
    if (e.deltaY > 0) goNext(); else goPrev();
  }, { passive:false, capture:true });

  /* ---- handoff index <-> páginas de produto (Opção B do backlog) ---- */
  if (!AUTO){
    // saindo da index em apresentação ao clicar num card → lembra o modo e o card
    document.addEventListener('click', function(e){
      if (!active) return;
      var link = e.target.closest && e.target.closest('[data-pt-href]');
      if (!link) return;
      try{ sessionStorage.setItem('pm', '1'); sessionStorage.setItem('pm-stop', String(curIdx)); }catch(err){}
      // não previne: o page-transition faz a navegação (cortina)
    }, true);
  }
  function autoEnterIfNeeded(){
    var pm = null, ps = null;
    try{ pm = sessionStorage.getItem('pm'); ps = sessionStorage.getItem('pm-stop'); }catch(e){}
    var tour = tourOn();
    if (pm !== '1' && !tour) return;
    if (AUTO){
      enter();                                    // produto entra em apresentação sozinho
      curIdx = 0; setY(0); renderDotsState();     // sempre no topo (tour segue via pmtour)
      try{ sessionStorage.removeItem('pm'); }catch(e){}
      return;
    }
    // INDEX
    enter();
    if (tour){
      var c = tourCard(), N = ecoCards().length;
      if (c >= 0 && c < N){
        setTimeout(function(){ goToEcoCard(c); }, 90);         // foca o próximo card (não abre)
      } else {
        tourSet(false);                                        // acabaram os cards → segue pra órbita
        var tryOrbita = function(n){                            // espera os triggers construírem
          var orbSi = -1; for (var i=0;i<SECTIONS.length;i++){ if (SECTIONS[i].sel==='#orbita'){ orbSi=i; break; } }
          var oi = orbSi>=0 ? firstStopIndexOf(orbSi) : -1;
          if (oi>=0) goToIndex(oi, false);
          else if (n>0) setTimeout(function(){ tryOrbita(n-1); }, 200);
        };
        setTimeout(function(){ tryOrbita(10); }, 150);
      }
      try{ sessionStorage.removeItem('pm'); }catch(e){}
    } else {
      var idx = parseInt(ps, 10); if (isNaN(idx)) idx = 0;
      setTimeout(function(){ goToIndex(idx, true); }, 80);
      try{ sessionStorage.removeItem('pm'); sessionStorage.removeItem('pm-stop'); }catch(e){}
    }
  }
  if (document.readyState === 'complete') setTimeout(autoEnterIfNeeded, 140);
  else window.addEventListener('load', function(){ setTimeout(autoEnterIfNeeded, 140); });

  /* handle p/ depuração */
  window.__pmode = {
    enter:enter, exit:exit, isActive:function(){ return active; },
    rebuild:rebuildIndex, stops:function(){ return activeStops; }, sections:function(){ return sections; },
    goToSection:goToSection, goToIndex:goToIndex, SECTIONS:SECTIONS
  };
})();
