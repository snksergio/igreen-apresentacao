---
name: alterar-site
description: Use ao receber QUALQUER pedido de alteração, adição ou remoção na landing iGreen ou nas páginas de produto - mexer em seção, texto, imagem, vídeo, cor, tamanho, animação, ou criar página nova. Classifica a natureza do pedido, aciona os guardiões certos, executa e valida em loop até a entrega estar provada.
---

# Ciclo de alteração da landing iGreen

Este projeto é pequeno e muito acoplado. O dono não é desenvolvedor: ele descreve o resultado e confia que você cuide das consequências. Siga o ciclo — ele existe porque cada etapa já pegou um bug real.

Leia `.claude/CLAUDE.md` e `DESIGN.md` antes de decidir qualquer coisa.

## Passo 1 — Classifique a natureza do pedido

Isso define quem você aciona. Não pule: acionar tudo desperdiça contexto, acionar de menos quebra o site.

| natureza | exemplos | guardiões |
|---|---|---|
| **Atualizar informação** ✅ | trocar um texto, corrigir um número, atualizar um preço, trocar uma foto pela versão nova | caminho curto — ver abaixo |
| **Item de lista** ⚠ | "adiciona mais um card", "tira esse plano", "troca a ordem" | **`colecoes-guardian` primeiro** + `scroll-guardian` + `geometria-guardian` + `apresentacao-guardian` |
| **Cosmético isolado** | trocar cor, texto, tamanho de fonte, opacidade | `geometria-guardian` se puder mudar altura de texto |
| **Estrutural** | aumentar/diminuir seção, adicionar/remover bloco | `scroll-guardian` (antes) + `geometria-guardian` + `apresentacao-guardian` |
| **Ativo novo** | imagem, vídeo, logo, ícone | `ativos-guardian` + `geometria-guardian` |
| **Comportamento** | animação, scroll, pin, snap, transição | `scroll-guardian` + `apresentacao-guardian` |
| **Não cabe na tela** | "no notebook fica diferente", estourou, cortou | `responsividade-guardian` |
| **Página nova** | nova página de produto | `DESIGN.md` + `ativos-guardian`; base é `produtos/template.html` |
| **Desempenho** | engasgou, travou, ficou lento | `performance-guardian` |

Dúvida entre duas? Escolha a mais cuidadosa.

### O caso mais comum: só atualizar informação

Este site é institucional e quase não cresce. Na prática, a maior parte dos pedidos vai ser **trocar um texto, um número ou uma foto** — feita por alguém que não entende de código e precisa de autonomia. Não transforme isso num processo de 6 etapas.

**Caminho curto**, quando a mudança é só de conteúdo:

1. Ache o trecho e troque. Se for foto, passe pelo `ativos-guardian` (formato, dimensões declaradas, lazy).
2. **Confira se o texto novo mudou a altura.** É o único risco real aqui: texto mais longo pode passar de 2 para 3 linhas e empurrar o que está abaixo. Se mudou de altura, deixa de ser conteúdo e vira estrutural — volte à tabela.
3. Olhe nas 3 configs (1920×946, 1536×750 @125%, 390×844 @3x). Em tela de altura menor um texto que cabia pode estourar.
4. Relate e pergunte antes de commitar.

Não precisa de comparador de geometria, nem de apresentação, nem de scroll — **desde que a altura não tenha mudado**. Essa é a única pergunta que separa o caminho curto do longo.

Se o pedido vier em linguagem vaga ("deixa isso melhor", "ajusta aí"), pergunte **o que a pessoa quer ver diferente**, não como fazer. Ela não sabe o como, e não deveria precisar saber.

**Atenção especial a "item de lista"** — é o pedido mais comum e o que mais quebra. Parece trivial ("é só mais um card") mas a quantidade de itens está codificada à mão em vários lugares que não reclamam quando ficam dessincronizados: posição por índice (`.g1`..`.g7`), animação por índice (~20 regras `nth-child`), passos da apresentação, e link para página interna. O item novo simplesmente nasce invisível ou sem posição. **Rode o inventário do `colecoes-guardian` antes de editar qualquer coisa.**

**Sinal de alerta:** se o pedido muda **altura** de qualquer coisa, é estrutural — mesmo que pareça só visual. Altura desloca tudo abaixo e atinge pins, snap, âncoras e apresentação.

## Passo 2 — Capture o ANTES (só para estrutural e comportamento)

Sem referência prévia não existe prova depois. Capture:

1. Geometria nas 3 configs (via `geometria-guardian`)
2. Enquadramento das 4 âncoras do menu
3. As 11 paradas da apresentação (via `apresentacao-guardian`)

Guarde os números na sua resposta ou em arquivo no scratchpad. **Não confie na memória.**

## Passo 3 — Entenda antes de mexer

Para mudanças estruturais ou de comportamento, peça ao `scroll-guardian` o mapa de impacto: o que se desloca, quais pins mudam de start/end, se algum snap cai na faixa alterada, e se o mobile usa outra coreografia (quase sempre sim).

Se o mapa revelar risco que o dono não previu, **diga em uma ou duas frases e siga em frente** com o trabalho completo, explicitando a suposição. Não pare esperando aprovação para decisão técnica que você pode medir.

## Passo 4 — Execute

- Comentários no código em português, explicando **por quê**, não o quê. Este projeto tem comentários que já salvaram sessões inteiras.
- Prefira **tempo (CSS)** a scroll para coreografia. Ver `DESIGN.md`.
- Anime só `opacity` e `transform`.
- Mudança no desktop **não** vale para o mobile automaticamente. Verifique se há bloco `@media (max-width:1024px)` ou `matchMedia` correspondente.
- Se criar um novo escritor de posição de scroll, respeite a posse (`autoAte`, `window.igNavAte`).

## Passo 5 — Valide em loop

Rode e **releia os números**. Se algo não fecha, volte ao passo 4. Não entregue com diferença inexplicada.

Mínimo obrigatório:
- [ ] Geometria: 1920×946 dpr1, 1536×750 dpr1.25, mobile 390×844 dpr3
- [ ] As 4 âncoras do menu com enquadramento igual ao ANTES — testadas **em ordens diferentes e repetindo**, sem recarregar
- [ ] Se mexeu em pin/altura: as 11 paradas da apresentação, passo a passo, para baixo e para cima
- [ ] Se mexeu em ativo: carregou (`naturalWidth > 0`), container com altura real, comparação pixel a pixel
- [ ] Console sem erro novo (o de CORS de fonte em `file://` é conhecido e esperado)

**Antes de acreditar em qualquer medição**, confirme que ela é válida: bomba de quadros ligada (`setInterval(() => gsap.ticker.tick(), 14)`) e página recém-navegada. Contagem de ScrollTriggers caindo ou `.jphoto` mudando de tamanho = medição inválida, não regressão.

## Passo 5b — Atualize o mapa (não pule)

Se você mudou **contagem, rótulo, ícone, CTA ou estrutura** de uma seção, atualize o arquivo dela em
`.claude/mapas/` **no mesmo commit da alteração**.

Por que isso é obrigatório: os mapas dizem coisas como "7 cards", "4 KPIs", "os CTAs sem destino
são estes". Quando a realidade muda e o mapa não, quem vier depois confia num número que não existe
e decide errado — e o pipeline passa a atrapalhar em vez de ajudar. Já aconteceu nesta base: o mapa
descrevia o 4º KPI como "1 app" muito depois dele ter virado "Expansão".

Regra prática: **se você teve que ler o mapa para fazer a mudança, você tem que atualizá-lo depois.**

## Passo 6 — Relate e pergunte

- Diga o que mudou em português comum, com os **números** que provam.
- Liste explicitamente o que **não** foi validado e por quê. Nunca deixe implícito.
- Se uma hipótese sua caiu no caminho, diga.
- **Pergunte antes de commitar.** Nunca commite nem faça push sem pedido explícito. O dono valida no navegador primeiro.

## Se o dono disser que algo quebrou

Não comece propondo correção. Reproduza primeiro, com receita determinística, e prove a causa. Este projeto já produziu vários diagnósticos "óbvios" que estavam errados — inclusive hipóteses registradas em mensagem de commit que depois tiveram de ser corrigidas.

Quando o dono disser **"às vezes"**, suspeite de corrida: dois disparadores para a mesma coisa, ou duas mecânicas escrevendo a mesma propriedade.
