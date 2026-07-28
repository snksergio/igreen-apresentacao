#!/usr/bin/env node
/* Ponto UNICO de entrada dos hooks do Claude Code.
   Uso:  node .claude/scripts/hook.js <sessao|antes-bash|depois-edicao>

   Por que em node e nao em "sh -c": o shell `sh` nao existe no Windows fora do
   Git Bash. Quem abrisse o projeto no terminal do VS Code sem ele tinha os hooks
   falhando calados — o pipeline parecia ativo e nao estava. Node ja e requisito
   (o revisar.js roda nele), entao usar node em tudo remove a dependencia de shell.

   Convencao de saida, medida neste projeto:
   - sessao        -> stdout, porque a saida do SessionStart entra no contexto.
   - antes/depois  -> stderr + exit 0, que aparece sem bloquear a ferramenta. */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SCRIPTS = __dirname;
const RAIZ = path.resolve(SCRIPTS, '..', '..');
const evento = process.argv[2] || '';

/* O Claude Code entrega o contexto da chamada como JSON no stdin. Pode vir vazio. */
function lerEntrada() {
  let bruto = '';
  try { bruto = fs.readFileSync(0, 'utf8'); } catch (e) { /* sem stdin */ }
  try { return JSON.parse(bruto); } catch (e) { return { _bruto: bruto }; }
}

/* Junta stdout E stderr de proposito: o revisar.js fala em stdout e o
   antes-de-commitar.js fala em stderr. Ler so um dos dois engolia os avisos
   de commit em silencio — exatamente o tipo de falha que este pipeline existe
   para evitar. */
function node(script, args) {
  const r = spawnSync(process.execPath, [path.join(SCRIPTS, script)].concat(args || []), {
    cwd: RAIZ, encoding: 'utf8',
  });
  return ((r.stdout || '') + (r.stderr || ''));
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) { return ''; }
}

const err = (s) => process.stderr.write(s + '\n');
const out = (s) => process.stdout.write(s + '\n');

/* ------------------------------------------------------------------ sessao */
/* Roda no inicio de cada sessao, no terminal ou no VS Code. Curto de proposito:
   isto custa contexto toda vez. O detalhe fica no CLAUDE.md. */
if (evento === 'sessao') {
  out('== Landing iGreen — pipeline ativo ==');
  out('Leia .claude/CLAUDE.md antes de tocar em arquivo. Resumo do que nao se negocia:');
  out('  1. Nunca commite nem faca push sem pedido explicito do dono.');
  out('  2. Mudanca que possa mover pixel passa pelo comparador de geometria (ou /validar-tudo).');
  out('  3. Nada de terceiros: sem logo, fonte, CDN, imagem ou link de fora (DESIGN.md).');
  out('  4. Nao quebre o modo apresentacao — ele substitui PowerPoint ao vivo.');
  out('  5. Meca, nao deduza. Diagnostico "obvio" aqui ja errou varias vezes.');
  out('Ponto de entrada de qualquer pedido: a skill "alterar-site".');
  out('Mudou secao? Atualize o mapa dela em .claude/mapas/ NO MESMO COMMIT.');

  /* O hook do git e o que protege quem commita fora do Claude Code. */
  const hp = git(['config', '--get', 'core.hooksPath']);
  if (hp !== '.githooks') {
    out('AVISO: as verificacoes de commit nao valem para o terminal comum aqui.');
    out('  Ligue uma vez, no diretorio do projeto:  git config core.hooksPath .githooks');
  }
  process.exit(0);
}

/* -------------------------------------------------------------- antes-bash */
if (evento === 'antes-bash') {
  const ev = lerEntrada();
  const cmd = String((ev.tool_input && ev.tool_input.command) || ev._bruto || '');

  if (/git\s+push/.test(cmd)) {
    err('PARE E CONFIRME: o dono pediu o push EXPLICITAMENTE nesta conversa? Se nao, cancele e');
    err('pergunte — ele valida no navegador antes e ja estranhou site sem mudanca por push que');
    err('nao aconteceu. Se pediu, siga.');
  }

  if (/git\s+commit/.test(cmd)) {
    err('PARE E CONFIRME: o dono pediu para commitar? Se nao, relate o que fez e pergunte primeiro.');
    /* Passa o comando adiante: `git commit -a` leva tambem os modificados sem stage. */
    err(node('antes-de-commitar.js', [cmd]).trim());
  }
  process.exit(0);
}

/* ----------------------------------------------------------- depois-edicao */
if (evento === 'depois-edicao') {
  const ev = lerEntrada();
  const ti = ev.tool_input || {};
  /* Edit/Write trazem file_path; Bash traz command (edicao por script conta). */
  const alvo = String(ti.file_path || ti.command || ev._bruto || '');
  if (!/\.(html|js|css)\b/.test(alvo)) process.exit(0);

  const r = node('revisar.js').trim();
  err(r.split('\n').slice(-40).join('\n'));
  process.exit(0);
}

err('hook.js: evento desconhecido "' + evento + '"');
process.exit(0);
