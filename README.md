# iGreen — Apresentação (projeto organizado)

Versão limpa e organizada do site de apresentação da iGreen. Nasceu de um MVP
single-file (`final-conteudo.html`, ~8 MB com tudo embutido em base64) que foi
**des-embutido**: os assets viraram arquivos reais e o HTML ficou leve (~0,5 MB).

## Estrutura

```
Organizado/
├── index.html          # a landing page (era final-conteudo.html)
├── assets/
│   ├── img/            # imagens (fotos, eco, rec, cars, qr, hand, map, plans…)
│   ├── video/          # vídeos .mp4 (bolt, sede2, glass, pay, tech-glass…)
│   ├── fonts/          # Inter Display (woff2)
│   └── pins/           # medalhas de graduação (pin-*.webp)
├── css/
│   └── tokens.css      # cores, fontes e tipografia base — p/ as telas internas
├── produtos/           # 5 telas internas de produto (a fazer) — ver README de lá
└── README.md
```

## Como o `index.html` funciona

- **CSS e JS continuam inline** no HTML — a página é sensível à ordem de execução
  (ScrollSmoother/GSAP e um script que reposiciona o footer). Mexer nisso é um
  passo separado e opcional.
- **GSAP, ScrollSmoother e three.js seguem embutidos** no HTML como `<script>`.
- **Todo asset visual agora é um arquivo** em `assets/` — nada mais em base64.

## Trocar um asset real (logo, foto, mockup)

Basta **substituir o arquivo** em `assets/` mantendo o mesmo nome. Ex.: para
trocar a foto de 2025, sobrescreva `assets/img/foto-2025.jpg`. Não precisa tocar
no HTML. (Se mudar o nome do arquivo, atualize a referência no `index.html`.)

## Rodar localmente

Por causa dos vídeos e fontes, sirva por HTTP (não abra via `file://`):

```bash
npx serve .        # ou: python -m http.server
```

Depois abra `http://localhost:3000` (ou a porta indicada).

## Próximos passos planejados

1. Conteúdo real: logos, mockups e fotos fiéis (só trocar arquivos em `assets/`).
2. As 5 telas internas de produto em `produtos/` (ver `produtos/README.md`).
3. (Opcional) extrair CSS/JS da landing para arquivos externos, se a manutenção pedir.

## Diferença vs. o arquivo inline

`index.html` tem **uma** adição de código que o `final-conteudo.html` inline não tem:
logo após criar o ScrollSmoother (desktop), um `ScrollTrigger.refresh()` em
`document.fonts.ready` e no `window load`. Isso corrige um desalinhamento de pin/scrub
(ex.: o título de "Resultados" descia demais) causado pelo FOUT das fontes agora externas
(`font-display:swap`) e mídias carregando via HTTP. **Se um dia regenerar esta pasta a
partir do inline, reaplique essa adição.**

## Notas de origem

- Gerado a partir de `../final-conteudo.html`. O restante da raiz do projeto
  (variantes, backups, protótipos, modelos 3D) foi **deixado intocado** como
  histórico.
- A antiga pasta `../assets/` é um repositório git separado
  (`github.com/snksergio/igreen-apresentacao`); aqui os arquivos foram copiados
  **sem** o `.git`. Se quiser versionar, inicie um git novo nesta pasta.
