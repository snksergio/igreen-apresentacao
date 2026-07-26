#!/usr/bin/env node
/* revisar.js — verificador de padrões deste projeto.
   Pega, NA HORA, os erros que já quebraram este site antes. Cada regra abaixo existe porque
   o problema realmente aconteceu — não são boas práticas genéricas.

   Uso:  node .claude/scripts/revisar.js [arquivo ...]     (sem argumento = todos os relevantes)
   Saída: lista de achados. Código 1 se houver ERRO, 0 se só houver avisos.

   É chamado automaticamente pelo hook PostToolUse depois de cada edição. */

const fs = require('fs');
const path = require('path');

const ERRO = 'ERRO', AVISO = 'AVISO';
const achados = [];
const add = (nivel, arq, linha, regra, msg) => achados.push({ nivel, arq, linha, regra, msg });

/* ---------- regras por linha ---------- */
const REGRAS = [
  {
    nome: 'lazy-sem-dimensoes',
    nivel: AVISO,   /* aviso, nao erro: o projeto tem muitos casos que funcionam. So quebra quando
                       o container tira a altura da imagem — mas ai quebra de forma invisivel. */
    testa: l => /<img\b/.test(l) && /loading\s*=\s*["']lazy/.test(l) && !(/\bwidth\s*=/.test(l) && /\bheight\s*=/.test(l)),
    msg: 'img com loading="lazy" SEM width/height. PERIGOSO se o container for absolute e tirar a altura da imagem (img{height:auto}): caixa de altura 0 -> o navegador nunca a considera perto da tela -> nunca carrega -> invisivel para sempre, sem erro (foi o que apagou o bg de moedas dos planos). Em TODOS os casos, declarar width/height tambem evita salto de layout (CLS). Se voce esta criando esta img agora, declare.'
  },
  {
    nome: 'anima-layout',
    nivel: ERRO,
    testa: l => /gsap\.(to|from|fromTo|set)\s*\(/.test(l) && /\b(width|height|top|left|marginTop|marginLeft)\s*:/.test(l) && !/\/\*/.test(l),
    msg: 'animacao de propriedade de LAYOUT (width/height/top/left). Recalcula layout a cada quadro e trava em maquina fraca. Use apenas opacity e transform (x/y/scale).'
  },
  {
    nome: 'terceiros',
    nivel: ERRO,
    testa: l => /(https?:)?\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr|cdnjs|googletagmanager|google-analytics|facebook\.net|placehold|unsplash|pexels)/.test(l),
    msg: 'referencia a terceiro. Este projeto e 100% autoral e offline-first: nada de CDN, fonte externa, imagem de banco ou script de terceiro. Ver DESIGN.md.'
  },
  {
    nome: 'fonte-nova',
    nivel: AVISO,
    testa: l => /font-family\s*:/.test(l) && !/Inter Display|Inter|inherit|sans-serif|monospace|var\(/.test(l),
    msg: 'font-family fora do padrao. O projeto usa somente Inter Display (2 arquivos locais em assets/fonts). Ver DESIGN.md.'
  },
  {
    nome: 'scrollTop-por-quadro',
    nivel: AVISO,
    testa: l => /(smoother|smr|s)\s*\.\s*scrollTop\s*\(/.test(l) && /onUpdate|requestAnimationFrame|ticker|setInterval/.test(l),
    msg: 'escrita de smoother.scrollTop() dentro de callback por quadro. Isso DESSINCRONIZA o ScrollSmoother: depois disso o scrollTo do menu move a barra e o conteudo nao anima. Empurre o scroll NATIVO (window.scrollTo).'
  },
  {
    nome: 'progress-suprime-callback',
    nivel: AVISO,
    testa: l => /\.progress\s*\(\s*1\s*\)/.test(l),
    msg: 'progress(1) SUPRIME callbacks no GSAP. Se algum onComplete dispara algo importante (revelar elemento, liberar scroll), ele sera pulado silenciosamente.'
  },
  {
    nome: 'blend-tela-cheia',
    nivel: AVISO,
    testa: l => /mix-blend-mode\s*:\s*(screen|soft-light|overlay|hard-light|color-dodge)/.test(l),
    msg: 'mix-blend-mode em camada possivelmente de tela cheia: a GPU rele os pixels de baixo e reescreve a tela por quadro. Se o gradiente for estatico e estiver sobre video, asse no arquivo (ver ativos-guardian).'
  },
  {
    nome: 'video-sem-atributos',
    nivel: AVISO,
    testa: l => /<video\b/.test(l) && !(/\bmuted\b/.test(l) && /\bplaysinline\b/.test(l)),
    msg: 'video sem muted e/ou playsinline. Sem os dois o autoplay e bloqueado (principalmente iOS).'
  },
  {
    nome: 'will-change-solto',
    nivel: AVISO,
    testa: l => /will-change\s*:/.test(l) && !/transform|opacity|auto/.test(l),
    msg: 'will-change em propriedade que nao seja transform/opacity gasta memoria de GPU sem ganho.'
  },
  {
    nome: 'sem-reduced-motion',
    nivel: AVISO,
    testa: (l, i, todas) => /ScrollTrigger\.create\s*\(/.test(l) && !todas.some(x => /prefers-reduced-motion/.test(x)),
    msg: 'arquivo cria ScrollTrigger mas nao menciona prefers-reduced-motion em nenhum lugar. Acessibilidade: respeite quem pediu menos movimento.'
  }
];

/* ---------- checagens de arquivo inteiro ---------- */
function checaArquivoInteiro(arq, txt) {
  if (/\.html$/.test(arq)) {
    const imgs = txt.match(/<img\b[^>]*>/g) || [];
    const semAlt = imgs.filter(t => !/\balt\s*=/.test(t)).length;
    if (semAlt) add(AVISO, arq, 0, 'img-sem-alt', semAlt + ' <img> sem atributo alt. Use alt="" se for decorativa — mas declare.');

    const semLazy = imgs.filter(t => !/loading\s*=/.test(t) && !/fetchpriority/.test(t)).length;
    if (semLazy > 2) add(AVISO, arq, 0, 'muitas-img-sem-lazy', semLazy + ' <img> sem loading nem fetchpriority. O que nao aparece no primeiro quadro deve ser lazy.');
  }
}

/* ---------- execucao ---------- */
const RAIZ = process.cwd();
let alvos = process.argv.slice(2).filter(a => fs.existsSync(a));
if (!alvos.length) {
  alvos = ['index.html'];
  ['js', 'produtos'].forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => { if (/\.(js|html)$/.test(f)) alvos.push(path.join(d, f)); });
  });
}
alvos = alvos.filter(a => !/legados|node_modules|\.claude[\\/]scripts/.test(a));

for (const arq of alvos) {
  let txt; try { txt = fs.readFileSync(arq, 'utf8'); } catch (e) { continue; }
  const linhas = txt.split(/\r?\n/);
  linhas.forEach((l, i) => {
    if (/^\s*(\/\*|\*|\/\/|<!--)/.test(l)) return;         // ignora comentario
    for (const r of REGRAS) {
      try { if (r.testa(l, i, linhas)) add(r.nivel, arq, i + 1, r.nome, r.msg); } catch (e) {}
    }
  });
  checaArquivoInteiro(arq, txt);
}

const erros = achados.filter(a => a.nivel === ERRO);
const avisos = achados.filter(a => a.nivel === AVISO);

if (!achados.length) {
  console.log('revisar: nenhum achado nos padroes do projeto (' + alvos.length + ' arquivo(s)).');
  process.exit(0);
}
/* Agrupa por REGRA e mostra no maximo 3 exemplos de cada. Uma lista de 76 achados identicos
   faz qualquer pessoa ignorar a ferramenta — e uma ferramenta ignorada nao previne nada. */
function relata(titulo, lista) {
  if (!lista.length) return;
  console.log('\n=== ' + titulo + ' ===');
  const porRegra = {};
  lista.forEach(a => { (porRegra[a.regra] = porRegra[a.regra] || []).push(a); });
  Object.keys(porRegra).forEach(regra => {
    const g = porRegra[regra];
    console.log('\n* ' + regra + '  (' + g.length + ' ocorrencia' + (g.length > 1 ? 's' : '') + ')');
    console.log('  ' + g[0].msg);
    console.log('  onde: ' + g.slice(0, 3).map(a => a.arq + ':' + a.linha).join(', ') +
      (g.length > 3 ? ' ... e mais ' + (g.length - 3) : ''));
  });
}
relata('ERROS — corrija antes de entregar', erros);
relata('AVISOS — confirme se e intencional', avisos);
console.log('\nresumo: ' + erros.length + ' erro(s), ' + avisos.length + ' aviso(s) em ' + alvos.length + ' arquivo(s).');
console.log('Detalhes de cada regra: .claude/agents/ e .claude/CLAUDE.md\n');
process.exit(erros.length ? 1 : 0);
