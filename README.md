# iGreen — site institucional

Landing institucional da iGreen Energy, com 8 páginas de produto e um **modo apresentação** que substitui PowerPoint em apresentações ao vivo.

## Antes de mexer, leia isto

O projeto é **pequeno em tamanho e alto em acoplamento**: o `index.html` tem cerca de 6.000 linhas com CSS e JavaScript embutidos, e uma mudança visual aparentemente inocente pode quebrar a navegação, o scroll e o modo apresentação ao mesmo tempo.

Por isso existe um pipeline de trabalho em **[`.claude/`](.claude/)**. Se você vai alterar qualquer coisa aqui usando Claude Code, ele é carregado automaticamente e cuida das consequências técnicas por você — inclusive validando que nada saiu de lugar.

- **[`.claude/CLAUDE.md`](.claude/CLAUDE.md)** — as regras, a anatomia do projeto e as armadilhas já descobertas. Comece por aqui.
- **[`DESIGN.md`](DESIGN.md)** — a identidade visual: cores, tipografia, movimento e o padrão de tratamento de imagens e vídeos. Todo o design é autoral; não há nada de terceiros no projeto e não deve haver.

Peça a alteração em português comum — "adiciona um card no ecossistema", "troca essa foto", "atualiza esse número". O pipeline identifica a natureza do pedido e aciona as verificações necessárias.

## Como abrir para testar

Não há build nem instalação. Abra o `index.html` no navegador.

Servindo por HTTP (recomendado — evita o aviso de fonte que o `file://` gera no console):

```bash
npx serve .
```

## Estrutura

```
index.html        a landing inteira (CSS e JS embutidos)
produtos/         8 páginas de produto + template.html (base para páginas novas)
css/              modo apresentação, transição de página e tokens
js/               modo apresentação, transição entre páginas, autoplay de vídeo por visibilidade
assets/           imagens, vídeos e fontes
.claude/          o pipeline de trabalho (agentes, verificações, comandos)
```

## Duas regras que valem para todos

1. **Valide no navegador antes de publicar.** Em três tamanhos: 1920×946, 1536×750 com escala de 125% do Windows, e 390×844 no celular. Neste projeto **altura é o que aperta**, não largura.
2. **Nada de terceiros.** Sem CDN, fonte externa, imagem de banco ou script de análise. As fontes são locais e as imagens são autorais.

## Verificação rápida

```bash
node .claude/scripts/revisar.js
```

Confere os padrões do projeto e aponta o que costuma quebrar aqui. Cada regra existe porque o problema aconteceu de verdade.
