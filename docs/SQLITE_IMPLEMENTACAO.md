# Implementacao SQLite no NeoView

Este documento e a referencia operacional da branch atual para GitHub Copilot e para implantacao local.

O objetivo e deixar claro como o projeto deve se comportar com SQLite como banco principal e unico, sem reintroduzir HANA ou PostgreSQL nesta branch.

## Estado atual da branch

- banco principal: SQLite
- arquivo local do banco: `server/data/neoview.sqlite`
- backend configurado para aceitar apenas `sqlite`
- Prisma configurado sobre o mesmo banco SQLite para introspecao, client tipado e Studio
- compartilhamento interno esperado: `http://IP_DA_MAQUINA:3389`
- fluxo principal de desenvolvimento: `npm run dev`
- fluxo principal de compartilhamento: `npm run start`

## Regras obrigatorias para o Copilot

- tratar `server/` como fonte de verdade para banco, autenticacao, relatorios, chatbot, busca, aprovacoes, exclusoes e permissoes
- manter `DB_PROVIDER=sqlite`
- manter `DB_CLIENT=sqlite`
- manter `SQLITE_PATH=data/neoview.sqlite`, salvo se o usuario mudar conscientemente o local do arquivo
- manter `DATABASE_URL="file:./data/neoview.sqlite"` apontando para o mesmo arquivo
- manter `VECTOR_PROVIDER=sqlite` por padrao
- nao reintroduzir HANA como banco principal nesta branch
- nao reintroduzir PostgreSQL como banco principal nesta branch
- nao migrar a stack para Python
- preservar `npm run start` como caminho principal para compartilhar a aplicacao por IP e porta
- preservar frontend e backend funcionando juntos no mesmo host quando a aplicacao estiver compartilhada

## Variaveis de ambiente esperadas

No arquivo `server/.env`, o estado correto para esta branch e:

```env
HOST=0.0.0.0
PORT=3390
NODE_ENV=development

JWT_SECRET=troque_este_secret_antes_de_publicar
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3389

DB_PROVIDER=sqlite
DB_CLIENT=sqlite
DB_SCHEMA=neoview_schema
SQLITE_PATH=data/neoview.sqlite
DATABASE_URL="file:./data/neoview.sqlite"
VECTOR_PROVIDER=sqlite
```

Observacoes:

- `DB_SCHEMA` pode continuar existindo por compatibilidade de configuracao, mas nao e a variavel principal do banco nesta branch
- nao exigir `host`, `user`, `password` ou `port` de banco para SQLite
- se o arquivo SQLite nao existir, a aplicacao deve conseguir criar e migrar a base

## Prisma sobre o SQLite local

O projeto agora tambem possui camada Prisma configurada sobre o mesmo banco:

- schema: `server/prisma/schema.prisma`
- config: `server/prisma.config.ts`
- client gerado: `server/src/generated/prisma`
- helper: `server/src/db/prisma.ts`

Comandos uteis:

```bash
npm --prefix server run prisma:pull
npm --prefix server run prisma:generate
npm --prefix server run prisma:studio
```

Observacao operacional:

- o Prisma Client gerado em `server/src/generated/prisma` deve permanecer versionado
- `npm --prefix server install` e `npm --prefix server run build` conferem automaticamente se o client Prisma ja existe
- se nao existir, a geracao automatica e tentada
- rode `prisma generate` novamente apenas quando houver mudanca intencional no schema Prisma

Objetivo desta integracao:

- permitir introspecao tipada do banco existente
- facilitar consultas novas com Prisma
- permitir uso do Prisma Studio no `neoview.sqlite`
- sem reescrever imediatamente o runtime SQL que ja esta estavel

Limite atual importante:

- varias tabelas existentes nao possuem chave unica adequada para o Prisma Client
- por isso, apos o `db pull`, algumas tabelas ficam com `@@ignore`
- isso nao quebra o runtime atual
- apenas indica que essas tabelas ainda devem continuar sendo acessadas pelo layer SQL existente ou futuramente remodeladas

## O que entra no arquivo `.zip` baixado do GitHub

Quando o usuario baixar o projeto compactado do GitHub:

- os arquivos versionados vao no `.zip`
- `package-lock.json` e `server/package-lock.json` vao no `.zip`
- `server/.env` vai no `.zip` se estiver versionado
- `server/data/neoview.sqlite` vai no `.zip` se estiver versionado
- `node_modules` nao vai no `.zip`

Regra importante para o Copilot:

- nunca assumir que `node_modules` existe apos extrair o `.zip`
- sempre orientar instalacao com:

```bash
npm install
npm --prefix server install
```

## Fluxo operacional recomendado

### Desenvolvimento local

Usar:

```bash
npm install
npm --prefix server install
npm --prefix server run prisma:generate
npm run dev
```

Esse fluxo usa:

- frontend em Vite
- backend local
- SQLite local em `server/data/neoview.sqlite`

### Compartilhamento interno por rede

Usar:

```bash
npm install
npm --prefix server install
npm run start
```

Esse e o fluxo mais importante para empresa.

Motivo:

- o frontend compilado e servido pelo backend
- as rotas `/api` ficam no mesmo host da interface
- outras pessoas acessam por `http://IP_DA_MAQUINA:3389`
- isso reduz risco de erro entre frontend e backend

## Compartilhamento por IP e porta

O desenho atual deve ser preservado assim:

- `scripts/start-runner.mjs` sobe o backend com `HOST=0.0.0.0`
- a porta de compartilhamento deve continuar `3389`
- o frontend deve consumir API por caminho relativo `/api`
- o backend deve servir os arquivos buildados do frontend
- o CORS deve continuar aceitando `localhost`, `127.0.0.1` e faixas privadas de rede interna

Regra para o Copilot:

- se for mexer em host, porta, proxy, `CLIENT_URL`, `API_URL`, `vite.config.ts` ou `server.ts`, nao quebrar o fluxo de acesso por `IP:3389`

## SQLite e DBeaver

O banco local pode ser aberto no DBeaver apontando diretamente para o arquivo `.sqlite`.

Na maquina atual de desenvolvimento, o caminho e:

`C:\Users\Samsung\Desktop\Neoview\project-neoview\prime_version_neoview\server\data\neoview.sqlite`

Na maquina da empresa, o caminho sera o da pasta real onde o `.zip` foi extraido.

Regra para o Copilot:

- nao assumir caminho absoluto fixo para o banco em producao local
- sempre tratar `SQLITE_PATH` como caminho relativo ao backend ou conforme configuracao do usuario
- se orientar o uso do DBeaver, mandar abrir o arquivo `server/data/neoview.sqlite` da copia local do projeto

## Persistencia dos dados

Com SQLite:

- os dados nao se perdem por tempo
- os dados continuam no arquivo do banco enquanto o arquivo existir
- reiniciar a maquina nao apaga os dados
- fechar a aplicacao nao apaga os dados

Riscos reais de perda:

- deletar a pasta do projeto
- sobrescrever o banco ao substituir arquivos manualmente
- limpeza automatica da maquina
- problema de permissao na pasta
- falha de disco

Regra para o Copilot:

- nao propor fluxo que trate SQLite como cache temporario
- tratar `server/data/neoview.sqlite` como persistencia real desta branch

## Codespaces

Nesta branch, `dev:codespaces` tambem deve respeitar SQLite.

Estado esperado:

- `scripts/dev-codespaces.mjs` deve forcar `DB_PROVIDER=sqlite`
- `scripts/dev-codespaces.mjs` deve forcar `DB_CLIENT=sqlite`
- `scripts/dev-codespaces.mjs` deve forcar `VECTOR_PROVIDER=sqlite`
- `server/.env.codespaces.example` deve refletir SQLite

Regra para o Copilot:

- se houver erro em Codespaces por `DB_PROVIDER=hana` ou outra configuracao antiga, tratar como resquicio de ambiente e corrigir para SQLite
- nao usar HANA como padrao em Codespaces nesta branch

## Busca global e chatbot

O comportamento atual que deve ser preservado:

- a busca global usa dados reais da plataforma
- a busca global nao deve usar mock antigo
- a busca global abre o dashboard correto da hierarquia aprovada
- a busca global deve permanecer compativel com exclusao definitiva de relatorios
- o chatbot usa persistencia local em SQLite
- o chatbot nao deve reencontrar relatorio excluido em novas recuperacoes
- historico antigo de conversa pode permanecer, mas novas recuperacoes nao devem vazar relatorio removido

## Funcionalidades que devem continuar corretas

- login por matricula U ou e-mail cadastrado
- topo `Login / Cadastro` na autenticacao
- `Cadastro` acessivel na autenticacao
- `Cadastro` fora do menu apos login
- estatisticas com pizza real
- opcao de area no lugar de histograma
- `shares` em cinza, nao verde
- criacao de graficos mantendo exemplo fake inicial
- graficos reais passando a refletir metricas reais quando um relatorio e selecionado
- persistencia dos graficos criados
- `Meus graficos` como bloco recolhivel, com busca, renomear e excluir
- exclusao definitiva de relatorios para gestor ou acima e superusuarios
- relatorio excluido nao pode aparecer na busca global, chatbot, dashboard ou outras abas por cache local indevido

## Validacao recomendada apos baixar o projeto

### Passos minimos

1. Extrair o `.zip`
2. Abrir a pasta do projeto
3. Rodar:

```bash
npm install
npm --prefix server install
```

4. Conferir `server/.env`
5. Rodar:

```bash
npm run start
```

6. Abrir `http://localhost:3389`
7. Testar tambem por `http://IP_DA_MAQUINA:3389`

### Validacoes importantes

- o login funciona
- o backend responde em `/api/health`
- a busca global funciona com dados reais
- o chatbot abre e responde
- os relatorios aparecem
- a exclusao definitiva remove o relatorio da plataforma
- os graficos continuam salvos apos recarregar

## O que o Copilot nao deve fazer nesta branch

- nao sugerir HANA como banco principal
- nao sugerir PostgreSQL como banco principal
- nao exigir credenciais de banco externo para o projeto subir
- nao separar frontend e backend no fluxo principal de compartilhamento
- nao tratar `node_modules` como algo presente no `.zip`
- nao assumir que o DBeaver vai abrir um caminho absoluto igual ao da maquina de desenvolvimento

## Resumo operacional

Se o usuario baixar o projeto compactado do GitHub:

- ele provavelmente vai precisar instalar dependencias
- o banco SQLite pode ir junto no proprio `.zip`
- a aplicacao pode rodar localmente sem banco externo
- o DBeaver pode abrir o arquivo `.sqlite`
- o compartilhamento por `IP:3389` continua sendo o fluxo correto para demonstracao interna

Se futuramente o projeto migrar para outro banco, isso deve ser tratado como uma nova migracao de ambiente, e nao como comportamento padrao desta branch.
