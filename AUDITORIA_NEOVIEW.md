# Auditoria NeoView

## Escopo aplicado

- Ajuste do app para publicacao estatica no GitHub Pages.
- Revisao de responsividade mobile com estrutura inspirada em app mobile: topo compacto, busca destacada e navegacao inferior fixa.
- Otimizacao do pacote inicial com rotas carregadas sob demanda e separacao de chunks.
- Validacao local com lint, TypeScript, build estatico, preview e screenshots headless.

## Arquivos alterados

- `package.json`: `npm run build` agora gera apenas o frontend estatico para Pages; `build:full` preserva o fluxo frontend + backend.
- `.github/workflows/deploy-pages.yml`: workflow oficial para compilar Vite e publicar `dist/` no GitHub Pages via GitHub Actions.
- `vite.config.ts`: separa chunks de React, UI, graficos e animacoes para reduzir gargalo do bundle inicial.
- `src/App.tsx`: troca para `HashRouter` e `lazy`/`Suspense`, evitando 404 em refresh no GitHub Pages e carregando paginas sob demanda.
- `src/components/MainLayout.tsx`: adiciona respiro inferior no mobile e integra a navegacao inferior.
- `src/components/MobileBottomNav.tsx`: nova barra mobile com Inicio, Relatorios, Validacoes, Favoritos e Menu.
- `src/components/TopNavbar.tsx`: topbar mobile mais enxuta, busca destacada abaixo da linha principal e logout escondido no mobile.
- `src/components/AppSidebar.tsx`: menu lateral mobile passa a expor a acao de sair.
- `src/components/FloatingAssistant.tsx`: botao do assistente sobe acima da navegacao inferior no mobile.
- `src/components/PwaInstallPrompt.tsx`: convite de instalacao deixa de aparecer imediatamente e nao cobre a primeira leitura da landing.
- `src/pages/Home.tsx`: espacamentos e titulos ajustados para celular.
- `src/pages/Landing.tsx`: hero, header e CTA revisados para telas pequenas.
- `src/pages/Login.tsx`: card mais compacto no mobile e exemplos sem quebras com crases literais.
- `src/index.css`: correcao do import da fonte Inter.
- `src/lib/demoApi.ts`: tipagem corrigida em delegacoes mockadas para passar no TypeScript.

## Validacoes executadas

- `npm run lint`: passou com 18 avisos preexistentes, sem erros.
- `npx tsc -p tsconfig.app.json --noEmit`: passou.
- `npm run build`: passou e gerou `dist/` sem alerta de chunk maior que 500 kB.
- `npm run preview -- --host 127.0.0.1 --port 4173`: servido localmente com resposta HTTP 200.
- Screenshots headless em Chrome: landing desktop, landing mobile e home mobile autenticada.

## Observacoes

- `npm --prefix server install` foi interrompido porque a compilacao nativa de `better-sqlite3` ficou travada por tempo prolongado. Isso nao bloqueia o GitHub Pages, pois o deploy publicado e estatico.
- Para ativar o deploy no GitHub, o repositorio precisa estar configurado em Settings > Pages com Source igual a GitHub Actions.
