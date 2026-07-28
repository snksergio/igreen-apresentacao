<!-- Este texto aparece sozinho ao abrir a PR. Apague o que nao se aplica. -->

## O que muda, para quem usa o site

<!-- Em português comum, o efeito visível. Não o arquivo mexido. -->

## Como foi verificado

<!-- Números, não adjetivos. "Olhei e parece igual" não é validação neste projeto. -->

- [ ] Rodei `node .claude/scripts/revisar.js` e não introduzi **ERRO** novo
- [ ] Testei nas três configurações: **1920×946**, **1536×750 @125%**, **390×844 @3x**
- [ ] Se pode ter movido pixel: comparei a geometria antes/depois
- [ ] Se mexi em altura, pin ou ordem de seção: percorri o **modo apresentação** inteiro, para baixo e para cima
- [ ] Se mexi em contagem, rótulo, ícone, CTA ou estrutura de seção: **atualizei o mapa** em `.claude/mapas/` nesta mesma PR
- [ ] Se troquei um número visível: procurei o gêmeo em `data-target` / `data-cnum`
- [ ] Se criei `href="#id"`: confirmei que o ID existe (âncora para ID inexistente falha em silêncio)
- [ ] Console sem erro novo (o de CORS de fonte em `file://` é conhecido e esperado)

## O que ficou sem validar

<!-- Liste explicitamente. Não deixe implícito. Se nada ficou, escreva "nada". -->

---

Antes de abrir a PR, vale ler `.claude/CLAUDE.md`. Se estiver usando Claude Code,
o `git commit` já dispara essas conferências sozinho; para commit feito pela mão,
ligue uma vez: `git config core.hooksPath .githooks`.
