# SQLite + GitHub Copilot no NeoView

Este documento e o ponto de partida para o GitHub Copilot quando ele estiver entrando neste projeto do zero.

Leia este arquivo antes de sugerir arquitetura, banco, fluxo de instalacao ou alteracoes estruturais.

## Contexto inicial obrigatorio

- esta branch usa SQLite como banco principal e unico
- o arquivo do banco local fica em `server/data/neoview.sqlite`
- Prisma tambem esta configurado sobre o mesmo banco SQLite
- a aplicacao precisa continuar funcionando localmente sem banco externo
- o frontend e o backend devem continuar integrados
- o fluxo principal de desenvolvimento e `npm run dev`
- o fluxo principal de compartilhamento interno e `npm run start`
- a aplicacao deve continuar acessivel por `http://IP_DA_MAQUINA:3389`
- nao migrar para Python
- nao trocar a stack principal do projeto

## O que o Copilot deve assumir ao entrar no projeto

- o repositorio pode ser baixado por `.zip`
- `node_modules` nao vem no download do GitHub
- o usuario precisara instalar dependencias localmente
- o banco SQLite pode ja vir junto no projeto, se o arquivo estiver versionado
- o backend deve subir sem depender de credenciais de banco remoto
- o DBeaver pode abrir diretamente o arquivo `.sqlite`

## Primeiros arquivos que o Copilot deve ler

Se estiver analisando o projeto do zero, leia primeiro:

- `README.md`
- `server/README.md`
- `server/.env`
- `server/.env.example`
- `server/src/config/env.ts`
- `server/src/db/connection.ts`
- `server/src/db/migrate.ts`
- `server/src/db/prisma.ts`
- `server/prisma/schema.prisma`
- `server/prisma.config.ts`
- `server/src/server.ts`
- `server/src/routes/searchRoutes.ts`
- `server/src/routes/reportRoutes.ts`
- `server/src/routes/chatRoutes.ts`
- `server/src/services/reportCatalogService.ts`
- `server/src/services/superadminService.ts`
- `server/src/services/reportApprovalService.ts`
- `server/src/services/memoryService.ts`
- `server/src/vectorstore/storeResolver.ts`
- `server/src/vectorstore/sqliteVectorStore.ts`
- `src/lib/api.ts`
- `src/components/GlobalSearch.tsx`
- `src/components/Chatbot/ChatSources.tsx`
- `src/pages/Login.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/Indicators.tsx`
- `src/components/analytics/ChartBuilder.tsx`
- `src/components/analytics/ChartPreview.tsx`
- `src/hooks/useAnalyticsChart.ts`

## Regras obrigatorias de banco

- manter `DB_PROVIDER=sqlite`
- manter `DB_CLIENT=sqlite`
- manter `SQLITE_PATH=data/neoview.sqlite`, salvo se o usuario pedir outra localizacao
- manter `DATABASE_URL="file:./data/neoview.sqlite"` alinhado com o mesmo banco
- manter `VECTOR_PROVIDER=sqlite` por padrao
- tratar `server/data/neoview.sqlite` como persistencia real, nao como cache temporario

## O que o Copilot nao deve presumir

- nao presumir que HANA e o banco principal nesta branch
- nao presumir que PostgreSQL e o banco principal nesta branch
- nao presumir que existe servidor de banco externo
- nao presumir que `node_modules` veio no `.zip`
- nao presumir que Codespaces e o ambiente principal de execucao
- nao presumir que o caminho absoluto do banco sera igual em todas as maquinas

## O que o Copilot nao deve fazer

- nao reintroduzir HANA como configuracao principal
- nao reintroduzir PostgreSQL como configuracao principal
- nao exigir credenciais de host, usuario e senha para o banco local SQLite
- nao apontar Prisma para um banco diferente do `server/data/neoview.sqlite` sem pedido explicito
- nao quebrar o compartilhamento por `IP:3389`
- nao separar frontend e backend no fluxo principal de compartilhamento
- nao voltar a usar mocks em fluxos que ja usam dados reais da plataforma

## Fluxo correto de instalacao apos baixar o `.zip`

O Copilot deve orientar este fluxo:

```bash
npm install
npm --prefix server install
npm --prefix server run prisma:generate
```

Depois:

```bash
npm run dev
```

Ou, para compartilhar com outras pessoas na rede:

```bash
npm run start
```

## Fluxo correto de compartilhamento interno

O comportamento que deve ser preservado:

- `npm run start` sobe a aplicacao para acesso interno
- o frontend e servido junto com o backend
- as chamadas de API devem continuar usando `/api`
- o backend deve aceitar conexoes em `0.0.0.0`
- a aplicacao deve continuar acessivel por `http://IP_DA_MAQUINA:3389`

## Prisma no SQLite desta branch

Conceitos ja aplicados:

- `prisma init` configurado para SQLite
- `prisma db pull` apontando para `server/data/neoview.sqlite`
- Prisma Client gerado em `server/src/generated/prisma`
- helper singleton em `server/src/db/prisma.ts`
- Prisma Studio disponivel para inspecionar o banco local

Comandos que o Copilot pode orientar:

```bash
npm --prefix server run prisma:pull
npm --prefix server run prisma:generate
npm --prefix server run prisma:studio
```

Observacao operacional:

- o Prisma Client gerado em `server/src/generated/prisma` deve ser mantido versionado nesta branch
- `npm --prefix server install` e `npm --prefix server run build` validam automaticamente se o client ja existe
- se o client nao existir, o projeto tenta gerar automaticamente
- so rode `prisma generate` de novo quando o schema Prisma realmente mudar

Regras importantes:

- Prisma usa o mesmo arquivo SQLite do runtime principal
- nao criar um `dev.db` paralelo
- nao trocar o runtime inteiro para Prisma de uma vez sem pedido explicito
- usar Prisma primeiro para introspecao, consultas novas tipadas e exploracao do banco
- antes de usar um model no Prisma Client, verificar se ele nao ficou com `@@ignore`

Limitacao atual que o Copilot deve conhecer:

- varias tabelas do projeto nao possuem identificador unico valido para o Prisma Client
- essas tabelas aparecem introspectadas com `@@ignore`
- nesses casos, o acesso continua sendo pelo runtime SQL existente, nao pelo Prisma Client

## SQLite e DBeaver

O Copilot deve entender que o banco pode ser inspecionado diretamente no DBeaver.

Na maquina atual de desenvolvimento, o arquivo esta em:

`C:\Users\Samsung\Desktop\Neoview\project-neoview\prime_version_neoview\server\data\neoview.sqlite`

Mas em outra maquina o caminho muda para a pasta real onde o projeto foi extraido.

Regra:

- orientar o DBeaver a abrir o arquivo `server/data/neoview.sqlite` da copia local do projeto
- nao fixar o caminho absoluto da maquina atual como se fosse universal

## Busca global e chatbot

O estado funcional que o Copilot deve preservar:

- a busca global usa dados reais
- a busca global nao usa mais o mock antigo
- a busca global abre o dashboard correto da hierarquia do relatorio aprovado
- a busca global agora usa FTS5 no SQLite como caminho preferencial
- o chatbot persiste sessoes e mensagens no SQLite
- o chatbot usa `semantic_cache` e `report_chunks` no SQLite
- relatorio excluido definitivamente nao deve reaparecer em novas recuperacoes do chatbot

## Exclusao definitiva de relatorios

Ao excluir definitivamente um relatorio, o Copilot deve preservar a regra de que ele deve sumir:

- do banco
- da busca global
- do dashboard
- do chatbot em novas recuperacoes
- das demais abas que dependam do catalogo

Historico antigo de conversa pode permanecer, mas novas recuperacoes nao devem reencontrar o relatorio removido.

## Comportamentos de produto que devem continuar corretos

- login por matricula U ou e-mail
- topo `Login / Cadastro` na autenticacao
- `Cadastro` disponivel na autenticacao
- `Cadastro` fora do menu apos login
- pagina de Estatisticas com pizza real
- opcao de area no lugar de histograma
- `shares` em cinza
- bloco de exemplo fake para mostrar como ficaria um grafico
- graficos reais refletindo metricas reais quando um relatorio e selecionado
- persistencia dos graficos criados
- secao `Meus graficos` recolhivel, com busca, renomear e excluir

## Como o Copilot deve pensar ao sugerir mudancas

Antes de propor qualquer alteracao, considerar:

1. isso continua funcionando com SQLite?
2. isso preserva o fluxo por `.zip`?
3. isso preserva `npm run dev` local?
4. isso preserva `npm run start` para compartilhamento por IP?
5. isso evita reintroduzir dependencia desnecessaria de banco externo?

Se a resposta for nao para algum desses pontos, a sugestao precisa ser revista.

## Resumo final para o Copilot

Se estiver entrando no projeto do zero, pense assim:

- este projeto roda localmente com SQLite
- o banco fica em um arquivo local
- o usuario pode baixar o projeto compactado do GitHub
- `node_modules` nao vem junto
- as dependencias precisam ser instaladas
- o backend nao depende de banco remoto
- o compartilhamento correto com outras pessoas e por `npm run start` e `IP:3389`
- qualquer mudanca deve preservar esse desenho
