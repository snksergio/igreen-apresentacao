---
description: Smoke test completo da landing — geometria nas 3 configs, âncoras do menu, paradas da apresentação, ativos e console. Não altera nada.
---

Rode a bateria completa de validação da landing iGreen, **sem alterar nenhum arquivo**. Este é um teste de fumaça: ele só observa e relata.

Leia `.claude/CLAUDE.md` antes de começar, e lembre que toda medição exige a bomba de quadros e carga limpa.

Execute nesta ordem e relate em tabela:

1. **Geometria** — via `geometria-guardian`, nas 3 configs (1920×946 dpr1, 1536×750 dpr1.25, mobile 390×844 dpr3). Se não existir referência salva, gere uma nova e diga que passou a ser o baseline.

2. **Âncoras do menu** — via `scroll-guardian`. Clique `#ecossistema2`, `#simulador`, `#orbita`, `#planos` em ordens diferentes e repetindo, sem recarregar. Enquadramento esperado (1920×946): 0 / 90 / 0 / 90.

3. **Modo apresentação** — via `apresentacao-guardian`. Percorra as 11 paradas, passo para baixo e para cima em cada uma, medindo movimento de scroll (nunca o rótulo). Pule o interior do Ecossistema, que navega para página de produto.

4. **Ativos** — via `ativos-guardian`. Procure imagens que não carregaram: `naturalWidth === 0` ou container com altura 0. Atenção especial a `loading="lazy"` **sem** `width`/`height` — esse padrão já deixou uma imagem invisível para sempre.

5. **Console** — erros novos. O CORS de fonte em `file://` é conhecido e não conta.

6. **Vídeos** — tocam ao entrar na tela e pausam ao sair.

Ao final, entregue: o que passou, o que falhou com o número que prova, e o que não foi possível testar e por quê. Não corrija nada sem o dono pedir.
