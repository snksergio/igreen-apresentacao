#!/usr/bin/env node
/* Roda no momento do commit (hook PreToolUse). NAO bloqueia — avisa.
   Verifica o que costuma ser esquecido justamente na hora de fechar o trabalho.
   Uso: node .claude/scripts/antes-de-commitar.js */

const { execSync } = require('child_process');
const fs = require('fs');

const sh = (c) => { try { return execSync(c, { encoding: 'utf8' }).trim(); } catch (e) { return ''; } };

/* Quais arquivos entram NESTE commit.
   Regra: normalmente e o que esta staged. Mas `git commit -a` tambem leva os
   modificados sem stage — e ai olhar so o staged deixava passar alteracao do
   site sem aviso. Recebe o comando como argumento para decidir. */
const cmdGit = process.argv[2] || '';
const staged = sh('git diff --cached --name-only').split('\n').filter(Boolean);
const modif = sh('git diff --name-only').split('\n').filter(Boolean);
let arq = staged;
if (/\s-(?:[a-zA-Z]*a[a-zA-Z]*)\b|--all\b/.test(cmdGit)) arq = [...new Set([...staged, ...modif])];
else if (!staged.length) arq = modif; // nada staged: a intencao e commitar o que esta ai
if (!arq.length) process.exit(0);

const avisos = [];
const site = arq.filter(f => /^(index\.html|produtos\/.*\.html|js\/.*\.js|css\/.*\.css)$/.test(f));
const mapas = arq.filter(f => f.startsWith('.claude/mapas/'));

/* 1) mexeu no site e nao atualizou mapa nenhum */
if (site.length && !mapas.length) {
  avisos.push('Voce alterou ' + site.length + ' arquivo(s) do site e NENHUM mapa em .claude/mapas/.\n' +
    '     Se mudou contagem, rotulo, icone, CTA ou estrutura de secao, o mapa precisa ser atualizado\n' +
    '     NO MESMO COMMIT — mapa velho faz o proximo confiar num numero que nao existe.\n' +
    '     Se a mudanca nao afeta nenhum mapa (ex.: so cor ou texto solto), ignore este aviso.');
}

/* 2) numero visivel trocado sem olhar os contadores animados */
const idx = arq.includes('index.html') ? sh('git diff --cached -U0 index.html') || sh('git diff -U0 index.html') : '';
if (/^[+-].*\b\d{2,3} mil\b/m.test(idx) && !/data-(target|cnum)/.test(idx)) {
  avisos.push('Voce mudou um numero em texto ("N mil") mas nao tocou em data-target/data-cnum.\n' +
    '     Esses atributos guardam o MESMO numero e sao o que anima subindo na tela. O site pode\n' +
    '     mostrar o valor novo e animar ate o antigo. Procure: grep -n "data-target\\|data-cnum" index.html');
}

/* 3) href novo para ancora — o ID existe? */
const todos = arq.filter(f => /\.html$/.test(f));
for (const f of todos) {
  const d = sh('git diff --cached -U0 -- ' + f) || sh('git diff -U0 -- ' + f);
  for (const m of d.matchAll(/^\+.*href="#([A-Za-z][\w-]*)"/gm)) {
    const id = m[1];
    let html = ''; try { html = fs.readFileSync(f, 'utf8'); } catch (e) {}
    if (html && !html.includes('id="' + id + '"')) {
      avisos.push('Em ' + f + ' ha href="#' + id + '" mas NAO existe id="' + id + '" no arquivo.\n' +
        '     Ancora para ID inexistente falha em SILENCIO: sem erro no console, o botao so nao faz nada.');
    }
  }
}

/* 4) o verificador de padroes passa? */
const rev = sh('node .claude/scripts/revisar.js');
const mErr = rev.match(/(\d+) erro\(s\)/);
if (mErr && +mErr[1] > 0) {
  avisos.push('O revisar.js encontrou ' + mErr[1] + ' ERRO(S). Rode e corrija antes de commitar:\n' +
    '     node .claude/scripts/revisar.js');
}

if (!avisos.length) { console.error('antes-de-commitar: nada a apontar.'); process.exit(0); }

console.error('\n=== ANTES DE COMMITAR — ' + avisos.length + ' ponto(s) para conferir ===');
avisos.forEach((a, i) => console.error('\n  ' + (i + 1) + ') ' + a));
console.error('\n  (avisos, nao bloqueios. Confirme se sao intencionais e siga.)\n');
process.exit(0);
