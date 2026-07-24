/* Transição de página "cortina" + retorno à seção — ver css/page-transition.css.
   Requisitos em cada página que usa:
     1) <link rel="stylesheet" href=".../css/page-transition.css">
     2) no <head>, ANTES do paint (evita flash na chegada):
        <script>try{if(sessionStorage.getItem('pt')){sessionStorage.removeItem('pt');
          document.documentElement.setAttribute('data-pt-state','cover');}}catch(e){}</script>
     3) primeiro filho do <body>: <div class="pt-curtain" aria-hidden="true"></div>
     4) este script antes de </body>
   Disparo: <a data-pt href="..."> ou qualquer elemento com [data-pt-href="destino.html"].
   Intro de conteúdo: marque elementos da página que chega com class .pt-intro.

   RETORNO À SEÇÃO (sem flick):
   Ao sair, guardamos a SEÇÃO onde o elemento clicado está (por id). Ao voltar,
   posicionamos o scroll no TOPO dessa seção — recalculado no layout novo — antes de
   revelar a cortina. Isso evita o flick de seções com scroll pinado/scrub (ex.: o deck
   do ecossistema, que é clonado em runtime): no topo da seção o efeito está no estado
   inicial (progresso 0), então nada "pula" ao revelar. Fallback: posição numérica. */
(function(){
  var html = document.documentElement;
  var REVEAL = 620, COVER = 500;
  /* normaliza o pathname p/ a chave: '/index.html' e '/' viram a mesma chave
     (a Vercel serve a home nas duas URLs; o link "voltar" vai p/ ../index.html,
     e sem isto a seção de origem não era restaurada — voltava pro topo). */
  var KEY = 'pt-scroll:' + location.pathname.replace(/index\.html$/, '');
  var IS_PRODUTO = /\/produtos\//.test(location.pathname);

  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  /* F5/reload sempre reinicia no TOPO. Sem isto, o navegador restaura o scroll no meio
     da pagina ANTES do ScrollSmoother/ScrollTrigger recalcularem, dessincronizando as
     secoes pinadas (o deck clonado do ecossistema quebrava). O retorno-a-secao pos-transicao
     nao e afetado (ele e feito por JS na chegada, via sessionStorage, nao pelo scroll nativo). */
  window.addEventListener('beforeunload', function(){
    try { var s = smoother(); if (s) s.scrollTop(0); } catch(e){}
    try { window.scrollTo(0, 0); } catch(e){}
  });

  /* VOLTAR (botao/gesto) via bfcache: o navegador restaura a pagina no MESMO estado
     em que ela saiu — inclusive com data-pt-state="in", que deixa a .pt-curtain
     cobrindo a tela (fica preta). Como os scripts NAO re-executam no restore do
     bfcache, limpamos o estado da cortina aqui, no pageshow persistido. */
  window.addEventListener('pageshow', function(e){
    if (!e.persisted) return;
    html.removeAttribute('data-pt-state');            // some com a cortina (volta pra translateY(100%))
    try { sessionStorage.removeItem('pt'); } catch(err){}
    if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch(err){} }
  });

  function smoother(){ return (window.ScrollSmoother && ScrollSmoother.get) ? ScrollSmoother.get() : null; }
  function getScroll(){ var s = smoother(); return s ? s.scrollTop() : (window.pageYOffset || document.documentElement.scrollTop || 0); }
  function setScroll(y){ var s = smoother(); if (s) s.scrollTop(y); else window.scrollTo(0, y); if (window.ScrollTrigger) ScrollTrigger.update(); }

  // resolve o alvo salvo (seção por id, ou posição numérica) para um scrollTop no layout atual
  function resolveTarget(){
    var t = null; try { t = sessionStorage.getItem(KEY); } catch(e){}
    if (!t) return null;
    if (t.indexOf('sec:') === 0){
      var el = document.getElementById(t.slice(4));
      if (el) return Math.max(0, getScroll() + el.getBoundingClientRect().top);
      return null;
    }
    if (t.indexOf('y:') === 0) return parseFloat(t.slice(2)) || 0;
    return null;
  }

  // CHEGANDO via transição: o <head> já marcou data-pt-state="cover".
  if (html.getAttribute('data-pt-state') === 'cover') {
    var hasTarget = false;
    try { hasTarget = !!sessionStorage.getItem(KEY); } catch(e){}
    if (IS_PRODUTO) {
      /* páginas internas são páginas-destino: sempre no topo (não "retomam" a
         última posição, que causava o scroll pro final ao reentrar). */
      try { sessionStorage.removeItem(KEY); } catch(e){}
    } else if (hasTarget) {
      var apply = function(){ var y = resolveTarget(); if (y != null) setScroll(y); };
      apply();                                             // enquanto coberto (invisível)
      requestAnimationFrame(apply);                        // após 1º frame do ScrollSmoother/pins
      setTimeout(function(){ apply(); try{ sessionStorage.removeItem(KEY); }catch(e){} }, 80);
    }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      html.setAttribute('data-pt-state', 'out');           // revela
      setTimeout(function(){ html.removeAttribute('data-pt-state'); }, REVEAL + 60);
    }); });
  }

  function go(href, el){
    if (!href) return;
    if (el && el.classList) el.classList.add('pt-clicked');   // feedback de clique
    try {
      sessionStorage.setItem('pt', '1');
      var sec = el && el.closest && el.closest('section[id]');
      sessionStorage.setItem(KEY, sec ? ('sec:' + sec.id) : ('y:' + getScroll()));
    } catch(e){}
    html.setAttribute('data-pt-state', 'in');              // cobre
    setTimeout(function(){ window.location.href = href; }, COVER);
  }

  document.addEventListener('click', function(e){
    var el = e.target.closest('a[data-pt], [data-pt-href]');
    if (!el) return;
    if (el.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    var href = el.getAttribute('data-pt-href') || el.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    e.preventDefault();
    go(href, el);
  }, false);

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest('[data-pt-href]');
    if (!el) return;
    e.preventDefault();
    go(el.getAttribute('data-pt-href'), el);
  });
})();
