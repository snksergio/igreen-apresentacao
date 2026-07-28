---
description: Publica o trabalho já commitado nos dois remotos, na ordem certa
---

# Publicar

Este projeto tem **dois remotos com papéis diferentes**. Publicar significa atualizar os dois, nesta ordem. Não improvise: a ordem existe por um motivo explicado abaixo.

| remoto | papel |
|---|---|
| `empresa` | `igreenlab/ui-apn-institucional`. É o **oficial**: histórico limpo, é dele que a próxima pessoa trabalha, e vai ganhar URL própria. |
| `origin` | Repo pessoal do dono. É o que a **Vercel** constrói hoje, porque o repo da organização tem restrição que impede conectar a Vercel nele. Serve para as pessoas testarem o visual. |

## Antes de qualquer coisa

**O dono pediu para publicar explicitamente?** Se não, pare: relate o que fez e pergunte. Ele valida no navegador antes, e já estranhou site sem mudança por causa de push que não aconteceu.

## Os dois passos

```bash
git push empresa main
node .claude/scripts/espelhar-visual.js
```

**Passo 1** manda o trabalho para o oficial.

**Passo 2** espelha o conteúdo no pessoal. Ele **não** faz `git push origin main` — isso seria recusado, porque o histórico do pessoal é o antigo (anterior à limpeza que tirou 452 MB e o material privado) e os dois divergiram. O script grava lá um commit cujo *conteúdo* é idêntico ao daqui, em cima do topo que o pessoal já tem: avanço normal, nada forçado, histórico dele preservado como backup.

O script **se recusa a rodar** se o seu `HEAD` não for igual ao `empresa/main`. Isso é de propósito: o que está no ar nunca deve conter algo que o repo oficial não tem.

Para só conferir se estão alinhados, sem escrever nada:

```bash
node .claude/scripts/espelhar-visual.js --conferir
```

## Depois de publicar

Diga ao dono **em que endereço testar** e o que esperar ver de diferente. Se a mudança foi só de pipeline ou documentação, avise que o site não muda visualmente — senão ele abre, não vê diferença e fica na dúvida se o push funcionou.

## Se o passo 1 for recusado

Significa que o oficial tem commit que você não tem. Traga antes com `git pull --rebase empresa main`, confira que nada quebrou (`node .claude/scripts/revisar.js`) e só então publique. **Nunca** resolva isso com `--force`.
