---
description: Publica o trabalho já commitado nos dois remotos, na ordem certa
---

# Publicar

Este projeto tem **dois remotos com papéis diferentes**. Publicar significa atualizar os dois, nesta ordem. Não improvise: a ordem existe por um motivo explicado abaixo.

| remoto | papel |
|---|---|
| `empresa` | `igreenlab/ui-apn-institucional`. É o **oficial** e vai **direto para produção** — ver o aviso abaixo. |
| `origin` | Repo pessoal do dono. É o que a **Vercel** constrói, porque o repo da organização tem restrição que impede conectar a Vercel nele. Serve para as pessoas testarem o visual. |

## ⚠ Push na `main` da empresa PUBLICA EM PRODUÇÃO

Não é só guardar código. O repo tem `.github/workflows/deploy-prod.yml` (posto pelo Antonio Marcos em 2026-07-28), que a cada push na `main` entra por SSH no servidor `162.141.111.97` e roda o `deploy.sh` do `igreen-vault`. **O site sai no ar na hora.**

Consequência prática: aqui não existe "subir para guardar". Se o trabalho não está validado nas três configurações de tela e no modo apresentação, ele não deve ir para a `main`. Em dúvida, abra PR em vez de empurrar direto — o template de PR carrega o checklist.

## Antes de qualquer coisa

**O dono pediu para publicar explicitamente?** Se não, pare: relate o que fez e pergunte. Ele valida no navegador antes, e já estranhou site sem mudança por causa de push que não aconteceu. Agora que push publica em produção, essa confirmação vale ainda mais.

**Alguém mais commita neste repo.** Um `git push` recusado com "fetch first" quer dizer que a empresa tem trabalho que você não tem — foi assim que quase perdemos o workflow do Antonio. Traga com `git pull --rebase empresa main`, confira que os arquivos dos dois lados sobreviveram, e só então publique. **Nunca** resolva com `--force`.

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
