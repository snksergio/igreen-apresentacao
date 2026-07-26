---
description: Desfaz com segurança a última alteração (ou volta a um ponto anterior), explicando em português comum o que vai acontecer antes de fazer.
---

O dono pediu para voltar atrás. Ele **não é desenvolvedor** — conduza você, e nunca o obrigue a entender git.

## Primeiro, descubra em que estado ele está

```bash
git status --short --branch     # há mudanças não salvas? o remoto está à frente?
git log --oneline -8            # os últimos pontos
git tag --list | tail -6        # marcos nomeados
```

Depois explique a situação em uma ou duas frases, em português comum. Traduza: "commit" = ponto salvo, "push" = enviado para o ar.

## Escolha o caminho pelo estado

**Mudanças ainda não salvas** (aparecem como ` M` no status) → descarte só os arquivos que a alteração tocou:
```bash
git checkout -- <arquivo> [<arquivo> ...]
```
Diga exatamente quais arquivos vão voltar. **Nunca** use `git checkout -- .` sem listar antes o que será perdido.

**Já salvo mas NÃO enviado** (o status mostra `ahead`) → desfaça o último ponto mantendo os arquivos como estão, para ele poder revisar:
```bash
git reset --soft HEAD~1
```

**Já enviado para o ar** → crie um ponto novo que anula o anterior. É o caminho seguro, porque não reescreve história:
```bash
git revert <hash> && git push origin main
```
Explique que o histórico ganha um ponto novo em vez de apagar — e que isso é proposital, para nada se perder.

**Voltar a um marco nomeado.** Marcos existentes no remoto:

| tag | o que era |
|---|---|
| `antes-otimizacao-video-sede` | antes de toda a série do vídeo da sede (blend assado, loop, cascata) |
| `checkpoint-perf-4itens` | marco de performance validado no notebook — bom ponto de retorno geral |
| `checkpoint-perf-3itens`, `checkpoint-perf-01/02/03` | etapas anteriores da otimização |

Mostre a ele o que existe entre o marco e o agora, **antes** de agir:
```bash
git log --oneline <tag>..HEAD
```
Assim ele decide sabendo o que perde. Se ele confirmar, prefira `git revert` dos commits em questão a `reset --hard`.

## Regras

- **Sempre diga o que será perdido antes de perder.** Liste os arquivos ou os commits, com uma linha em português explicando cada um.
- Antes de qualquer operação destrutiva, ofereça a alternativa não destrutiva.
- `reset --hard` e `push --force` só com pedido explícito e depois de explicar a consequência.
- Ao terminar, confirme o estado novo com `git status` e diga em uma frase o que ele deve ver no navegador agora — lembrando de **recarga forçada** se um arquivo de mídia mudou (trocar arquivo mantendo o nome não invalida cache).
