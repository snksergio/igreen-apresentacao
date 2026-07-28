# CTAs — mapa de estado

Este arquivo diz **onde cada botão está e o que ele faz hoje**. Não é lista de tarefas.

Vários CTAs de conversão do site ainda não têm fluxo (formulário, CRM). A decisão do dono foi
**comentar, não remover**, para religar quando existir. Todos os blocos comentados carregam o
marcador **`CTA-DESATIVADO`** — um `grep` por ele lista todos de uma vez.

Última conferência: 2026-07-28.

## Ativos, com destino real

| botão | onde | vai para |
|---|---|---|
| `Iniciar jornada` | hero da home | `#resultados` |
| `Simular minha recorrência` | hero da home | `#simulador` |
| `Conhecer o produto` | hero das 7 páginas de produto | `#produto` (âncora, **sem** `data-pt-href`) |
| `Compartilhar` | simulador de 6 páginas de produto | valores calculados + URL da página |
| `Voltar para o início` | rodapé das 7 páginas | `../index.html` |
| `Chamar no WhatsApp` | 7 páginas | `wa.me/5534996775654` com mensagem pronta citando o produto |
| `Baixar para iPhone` | seção do app, na home | `apps.apple.com/br/app/igreen-connect/id6744383784` |
| `Disponível no Android` | seção do app, na home | `play.google.com/store/apps/details?id=com.br.iGreenEnergy` |

Os links externos abrem em nova aba com `rel="noopener"`. O `&` da URL do Play Store está escapado
como `&amp;` no HTML — obrigatório, senão o parser pode truncar o parâmetro.

## Comentados, esperando o fluxo de conversão

| onde | botão |
|---|---|
| header da home | `Fale conosco` |
| planos da home (2 cards) | `Escolher Connect Plus` · `Escolher Connect Full` |
| rodapé das 7 páginas | `Quero ser licenciado` · `Falar com um consultor` |
| meio da Conexão Expansão | `Quero ser licenciado` |

Ao religar: descomente o bloco e **dê um destino real**. Se for âncora, confirme que o ID existe
(ver abaixo). Se for link externo, use `target="_blank" rel="noopener"`.

## Sem destino, a decidir

- **`Começar agora`** (home) — único CTA visível que ainda não leva a lugar nenhum.
- Um `href="#"` sem texto por volta da linha 2156 do `index.html` — verificar o que é antes de mexer.

## `href="#"` que estão CORRETOS — não ligue

`Ver extrato`, `Ver toda jornada` e `Ver detalhes` (×2) ficam **dentro do mockup do celular**, na
seção do app. São parte da tela simulada, não botões do site. O dono confirmou: ignorar.

## Duas armadilhas desta área

**Âncora para ID inexistente falha em silêncio.** Três botões apontavam para `#plano`, `#simulacao` e
`#contato` — nenhum existe. O handler de âncora faz `querySelector`, não acha, e retorna **sem
`preventDefault` e sem erro no console**: o botão parece morto sem nenhuma pista. Sempre confira o ID.

**`data-pt-href` é só para navegar entre páginas.** Em âncora da mesma página ele faz o clique tentar
"navegar" para o próprio documento. Remova ao converter link de página em âncora.

## Sobre o compartilhar

Já implementado nos dois lugares, com lógicas próprias:

- **Home** (`#shareBtn`): monta a mensagem com `#oTit`, `#oRec`, `#oTot` + `location.href`.
- **Páginas de produto** (`#shareProd`): monta com `#oEco`, `#oRec`, `#oTotal` + `location.href`.

No celular usa `navigator.share` (folha nativa do sistema); no desktop copia para a área de
transferência e mostra "Copiado!" por 1,6s. Sem SDK de terceiro — coerente com o `DESIGN.md`.

**As duas APIs exigem HTTPS.** Em `file://` falham caladas e o botão parece quebrado — teste
servindo por http (`npx serve .`) ou na Vercel.

`conexaoexpansao.html` não tem simulador (nenhum id de resultado), então não recebeu o botão.

**Melhoria possível, não feita:** levar os valores na URL (ex.: `?consumo=350`) e o simulador
reconstruir o resultado ao carregar. Hoje quem recebe o link vê o simulador vazio, com os valores
apenas no texto da mensagem. É a parte grande e nunca foi pedida como prioridade.
