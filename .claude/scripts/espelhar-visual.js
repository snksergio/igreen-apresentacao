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
  console.error('  -> IGUAIS. O pessoal ja esta visualmente alinhado.');
  /* Conteudo igual NAO garante backup em dia: o ramo espelho-empresa pode estar atras (ex.:
     publicacao anterior falhou so nessa parte). Confere sempre, senao o backup apodrece
     calado -- que e o pior modo de falhar para um backup. */
  if (!conferirApenas) backupHistoria();
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

/* BACKUP DE HISTORIA (2026-07-28) — o commit de espelho acima leva o CONTEUDO, mas a
   mensagem dele tem 8 linhas: o raciocinio de cada mudanca (60 linhas no exemplo do dia)
   fica so no repo da empresa. E outras pessoas commitam lá. Se aquele repo tiver problema,
   sem isto o dono recuperaria o codigo e perderia a documentacao de POR QUE ele e assim --
   e neste projeto o `git log` e a melhor documentacao que existe.
   Entao o ramo `espelho-empresa` no pessoal recebe o historico COMPLETO, com todas as
   mensagens. Nao encosta na `main` do pessoal (que e a que a Vercel constroi) e nao força
   nada: e o mesmo historico limpo avançando, sempre fast-forward.
   Roda junto do espelhamento de proposito: backup que precisa ser lembrado fica velho, e
   backup velho e pior que backup nenhum. */
function backupHistoria() {
  try {
    g(['push', 'origin', local + ':refs/heads/espelho-empresa']);
    console.error('  backup de historia: ramo espelho-empresa em ' + local.slice(0, 7));
  } catch (e) {
    console.error('  AVISO: nao consegui atualizar o ramo espelho-empresa no pessoal.');
    console.error('  O conteudo foi espelhado, mas o backup do HISTORICO ficou atras.');
    console.error('  Rode a mao: git push origin main:refs/heads/espelho-empresa');
    return;
  }
  /* Tags: as do pessoal apontam para o historico ANTIGO (de antes da limpeza) e o dono quer
     manter aquelas. Por isso as do historico limpo vao com prefixo `emp-`, sem sobrescrever
     nada. Cria so o que falta. */
  let remotas = '';
  try { remotas = g(['ls-remote', '--tags', 'origin']); } catch (e) { return; }
  const locais = g(['tag']).split('\n').map(s => s.trim()).filter(t => t && !t.startsWith('emp-'));
  const faltando = locais.filter(t => !remotas.includes('refs/tags/emp-' + t));
  if (!faltando.length) return;
  for (const t of faltando) {
    try { g(['tag', '-f', 'emp-' + t, t]); g(['push', 'origin', 'emp-' + t]); }
    catch (e) { console.error('  AVISO: tag emp-' + t + ' nao subiu.'); }
  }
  console.error('  marcos novos no backup: ' + faltando.map(t => 'emp-' + t).join(', '));
}

if (depois === arvore) {
  console.error('  -> OK: origin agora tem o mesmo conteudo. A Vercel vai reconstruir.');
  backupHistoria();
  process.exit(0);
}
console.error('  -> FALHOU: origin ficou com ' + depois + '. Confira antes de confiar.');
process.exit(1);
