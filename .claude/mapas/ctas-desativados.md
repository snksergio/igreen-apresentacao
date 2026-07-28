# CTAs de conversão — mapa para religar

Os botões de conversão do site **não têm destino ainda**. A decisão do dono (2026-07-28) foi
**comentar, não remover**, para religar quando existir o fluxo (formulário, CRM, WhatsApp...).

Este arquivo existe para que religar seja trivial: está tudo localizado, e o que é comentário
temporário está separado do que virou outra coisa em definitivo.

> **Ao religar:** procure no código pelo marcador `CTA-DESATIVADO` — é a etiqueta única deixada
> em cada bloco comentado.

## ESTADO ATUAL (executado em 2026-07-28)

O trabalho abaixo **já foi feito**. As seções seguintes descrevem onde cada coisa está, para o dia
de religar — não são tarefas pendentes.

**Comentados, esperando o fluxo de conversão:**

| onde | botão |
|---|---|
| header da home | `Fale conosco` |
| planos da home | `Escolher Connect Plus` e `Escolher Connect Full` |
| rodapé das 7 páginas | `Quero ser licenciado` e `Falar com um consultor` |
| meio da Conexão Expansão | `Quero ser licenciado` |

**Ativos, com destino real:**

| botão | onde | vai para |
|---|---|---|
| `Iniciar jornada` | hero da home | `#resultados` |
| `Simular minha recorrência` | hero da home | `#simulador` |
| `Conhecer o produto` | hero das 7 páginas | `#produto` (âncora, sem `data-pt-href`) |
| `Compartilhar` | simulador de 6 páginas | valores calculados + URL |
| `Voltar para o início` | rodapé das 7 páginas | `../index.html` |
| `Chamar no WhatsApp` | 7 páginas | `wa.me/5534996775654` com mensagem pronta |
| `Fale conosco` | *removido do header* | — |

Os três primeiros do hero **apontavam para IDs inexistentes** (`#plano`, `#simulacao`, `#contato`) e
por isso pareciam mortos sem dar erro. Ver a armadilha no `CLAUDE.md`.

`conexaoexpansao.html` **não tem simulador** — nenhum id de resultado — então não recebeu botão de
compartilhar.

## Ainda com `href="#"` na index (levantado em 2026-07-28)

Oito ocorrências, e **não são todas iguais** — separar importa:

**Precisam de destino real (o dono ainda não definiu):**
- `Baixar para iPhone` e `Disponível no Android` (seção do app) — deveriam apontar para App Store e
  Play Store. **São os mais relevantes da lista:** o visitante clica esperando baixar o app.
- `Começar agora`

**Decorativos, `href="#"` é correto:** `Ver extrato`, `Ver toda jornada` e `Ver detalhes` (×2) ficam
**dentro do mockup do celular** — são parte da tela simulada do app, não botões do site. Não ligue.

Há também um `href="#"` sem texto na linha ~2156. Verificar o que é antes de mexer.

## 1. Index — planos (COMENTAR, religar depois)

| onde | botão |
|---|---|
| `index.html` ~3220 | `Escolher Connect Plus` |
| `index.html` ~3245 | `Escolher Connect Full` |

Cada plano tem o seu. Comentar o `<a>`/`<button>` mantendo o card intacto — o card do plano
continua informando preço e benefícios, só não tem ação.

## 2. Index — rodapé (COMENTAR, religar depois)

`Quero ser licenciado` e `Falar com um consultor`. Dois botões, no bloco de CTA do rodapé.

Atenção: há também `Iniciar jornada` (~2184, hero) e `Fale conosco →` (menu, aponta para
`#contato`). O dono **não** pediu para mexer nesses dois — confirme antes de tocar.

## 3. Páginas de produto — vira COMPARTILHAR (mudança definitiva)

Nas 7 páginas (`produtos/conexao*.html`), o CTA `Quero ser licenciado` aparece **2 vezes** em
cada: uma no bloco `.ctas` (~linha 527, depois do cálculo) e outra no `.ctafinal` /`.ctas`
(~linha 876, fecho da página). São 14 botões no total.

Aqui **não é para comentar**: o dono quer que o botão passe a **compartilhar a página**. Ou seja,
o CTA perde a função de conversão e ganha a de divulgação. O texto do botão precisa mudar junto —
"Quero ser licenciado" não descreve mais o que ele faz.

## 4. Botão Compartilhar dos simuladores (NÃO FUNCIONA — implementar)

Já existe `<button class="sharebtn" id="shareBtn">` na index (~2819) e há um trecho de JS que
restaura o rótulo "Compartilhar" após 1600ms — ou seja, existe um esboço de estado ("Copiado!"),
mas o compartilhamento em si não funciona.

**O que o dono quer:** ao clicar, oferecer o meio de compartilhamento (redes ou copiar link),
levando **os valores que a pessoa preencheu** no simulador — não só a URL nua.

### Como implementar (decisões já pensadas)

- **`navigator.share`** é o caminho certo no celular: abre a folha nativa do sistema, com WhatsApp
  e redes, sem o site precisar conhecer nenhuma delas. Requer HTTPS (a Vercel já serve).
- **No desktop** o suporte é irregular. Fallback: um pequeno menu próprio com WhatsApp, LinkedIn,
  Facebook, X e **Copiar link**, usando `navigator.clipboard.writeText`. Manter o estado
  "Copiado!" que já existe no esboço.
- **Levar os valores** exige colocá-los na URL (ex.: `?consumo=350&plano=green`) e o simulador
  ler esses parâmetros ao carregar, para reconstruir o resultado. Sem isso, quem recebe o link vê
  o simulador vazio. **É a parte que dá mais trabalho e a que realmente entrega o pedido.**
- Mensagem sugerida: uma linha com o resultado ("Economia estimada de R$ X/mês") + a URL com os
  parâmetros. Redigir junto com o dono — é copy, não é técnica.
- **Nada de SDK de terceiro.** Os botões de rede são links `https://` montados à mão
  (`wa.me/?text=`, `linkedin.com/sharing/...`), coerente com a regra de zero terceiros do
  `DESIGN.md`.

### Cuidados deste projeto

- Os simuladores existem na index **e** nas páginas de produto — confirme quantos são antes de
  começar (`grep -c sharebtn`), a solução deve servir a todos.
- Se o menu de compartilhamento for uma camada sobreposta, **não** use `mix-blend-mode` nem
  `backdrop-filter` em tela cheia: ver `performance-guardian`.
- Passe pelo `geometria-guardian` no fim: comentar botões **muda a altura** dos blocos, e altura
  desloca tudo abaixo (âncoras, pins, paradas da apresentação).

## Ordem sugerida

1. Comentar os 4 botões (planos + rodapé) — rápido, e é o que o dono já decidiu
2. Trocar os 14 CTAs das páginas de produto por compartilhar
3. Implementar a folha de compartilhamento, começando pelo `navigator.share` e o "copiar link"
4. Só então os parâmetros na URL, que é a parte grande
5. Geometria nas 3 configs + apresentação, porque a altura mudou
