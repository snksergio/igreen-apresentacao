#!/usr/bin/env node
/* Espelha o CONTEUDO atual no remoto `origin` sem reescrever o historico dele.
   Uso: node .claude/scripts/espelhar-visual.js [--conferir]

   POR QUE ISTO EXISTE
   Sao dois remotos com papeis diferentes:
     empresa -> repo da organizacao, historico limpo. E o oficial.
     origin  -> repo pessoal do dono. E o que a Vercel constroi, porque o repo da
                organizacao tem restricao que impede conectar a Vercel nele.
   O historico do `origin` e o antigo (anterior a limpeza) e por isso um `git push`
   normal para lá é recusado: os historicos divergiram. Forçar apagaria o historico
   dele, que o dono quer manter como backup — e no pessoal nao faz mal ter arquivo
   a mais.

   A SAIDA
   Gravar no `origin` um commit cujo CONTEUDO (a arvore) e igual ao daqui, mas cujo
   pai e o proprio topo do `origin`. Isso e um avanço normal para ele: nada de push
   forçado, nada reescrito, e o site que a Vercel publica passa a ser identico ao
   da empresa. Rode depois de cada `git push empresa main`. */

const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..', '..');
const g = (args, input) => execFileSync('git', args, {
  cwd: RAIZ, encoding: 'utf8', input: input, stdio: ['pipe', 'pipe', 'pipe'],
}).trim();

const conferirApenas = process.argv.includes('--conferir');

try { g(['rev-parse', '--verify', 'refs/remotes/empresa/main']); }
catch (e) { console.error('Sem o remoto `empresa`. Nada a espelhar.'); process.exit(0); }

/* Nao espelhe trabalho que ainda nao foi para o repo oficial: o pessoal e o que
   vira site, e publicar dali algo que a empresa nao tem inverte a ordem. */
const local = g(['rev-parse', 'HEAD']);
const oficial = g(['rev-parse', 'refs/remotes/empresa/main']);
if (local !== oficial) {
  console.error('PARE: o seu HEAD (' + local.slice(0, 7) + ') nao e o mesmo do repo da');
  console.error('empresa (' + oficial.slice(0, 7) + '). Rode `git push empresa main` primeiro,');
  console.error('para o oficial nunca ficar atras do que esta no ar.');
  process.exit(1);
}

const arvore = g(['rev-parse', 'HEAD^{tree}']);
g(['fetch', '-q', 'origin', 'main']);
const topoOrigin = g(['rev-parse', 'refs/remotes/origin/main']);
const arvoreOrigin = g(['rev-parse', 'refs/remotes/origin/main^{tree}']);

console.error('  conteudo aqui:   ' + arvore);
console.error('  conteudo origin: ' + arvoreOrigin);

if (arvore === arvoreOrigin) {
  console.error('  -> IGUAIS. O pessoal ja esta visualmente alinhado; nada a fazer.');
  process.exit(0);
}
if (conferirApenas) {
  console.error('  -> DIFERENTES. Rode sem --conferir para alinhar.');
  process.exit(1);
}

const assunto = g(['log', '-1', '--pretty=%s']);
const msg = 'Espelha o conteudo do repo oficial (' + oficial.slice(0, 7) + ')\n\n'
  + 'Commit de espelhamento, nao de trabalho: a arvore aqui e identica a do repo\n'
  + 'da empresa, para a Vercel publicar exatamente o mesmo site. O raciocinio de\n'
  + 'cada mudanca esta no historico de igreenlab/ui-apn-institucional.\n\n'
  + 'No topo do oficial: ' + assunto + '\n';

const novo = g(['commit-tree', arvore, '-p', topoOrigin], msg);
console.error('  commit de espelho: ' + novo.slice(0, 7) + ' (pai ' + topoOrigin.slice(0, 7) + ')');

g(['push', 'origin', novo + ':refs/heads/main']);
g(['fetch', '-q', 'origin', 'main']);
const depois = g(['rev-parse', 'refs/remotes/origin/main^{tree}']);

if (depois === arvore) {
  console.error('  -> OK: origin agora tem o mesmo conteudo. A Vercel vai reconstruir.');
  process.exit(0);
}
console.error('  -> FALHOU: origin ficou com ' + depois + '. Confira antes de confiar.');
process.exit(1);
