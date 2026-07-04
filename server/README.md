# NeoView Server

Backend em Node.js + TypeScript com persistencia principal em SQLite.

## Estado atual

- provider principal: `sqlite`
- arquivo do banco: `data/neoview.sqlite`
- vector store padrao: `sqlite`
- alternativa vetorial opcional: `chromadb`
- Prisma disponivel para introspecao, client tipado e Prisma Studio sobre o mesmo banco SQLite

## Variaveis principais

Configure em `server/.env`:

```env
HOST=0.0.0.0
PORT=3390
CLIENT_URL=http://localhost:3389

DB_PROVIDER=sqlite
DB_CLIENT=sqlite
SQLITE_PATH=data/neoview.sqlite
DATABASE_URL="file:./data/neoview.sqlite"
VECTOR_PROVIDER=sqlite
```

Se o arquivo nao existir, copie de `server/.env.example`.

## Comandos uteis

```bash
npm.cmd --prefix server install --no-audit --no-fund
npm --prefix server run build
npm --prefix server run migrate
npm --prefix server run prisma:pull
npm --prefix server run prisma:generate
npm --prefix server run prisma:studio
npm --prefix server run reset
npm --prefix server run push:hana
npm --prefix server run sync:hana:full
npm --prefix server run sync:hana:incremental
```

## Bootstrap recomendado

Ao configurar uma maquina nova a partir do ZIP ou clone:

```bash
npm.cmd install --no-audit --no-fund
npm.cmd --prefix server install --no-audit --no-fund
cp .env.example .env
cp server/.env.example server/.env
npm.cmd run verify:setup
```

Depois disso, use `npm.cmd run dev` na raiz ou `npm.cmd run start` para producao local.

Observacao:

- o Prisma Client gerado em `src/generated/prisma` fica versionado para evitar dependencia obrigatoria de download extra no build
- `npm --prefix server install` e `npm --prefix server run build` verificam automaticamente se o client ja existe
- se o client nao existir, o projeto tenta rodar `prisma generate` automaticamente
- quando o schema Prisma mudar, rode `npm --prefix server run prisma:generate` conscientemente
- em ambiente corporativo, o repositorio desativa `audit` e `fund` por padrao via `.npmrc` para reduzir falhas desnecessarias durante `install`

## Sync opcional para SAP HANA

O runtime principal continua em SQLite. Se o time quiser replicar os dados para SAP HANA sem mexer na configuracao principal do app:

1. copie `server/.env.hana-sync.example` para `server/.env.hana-sync`
2. preencha `HANA_HOST`, `HANA_PORT`, `HANA_USER`, `HANA_PASSWORD` e `HANA_SCHEMA`
3. instale o driver oficial quando for ativar essa integracao:

```bash
npm --prefix server install @sap/hana-client
```

Carga inicial com criacao da estrutura base no HANA:

```bash
npm --prefix server run sync:hana:full -- --ensure-tables
```

Sincronizacao incremental:

```bash
npm --prefix server run sync:hana:incremental
```

Observacoes:

- o HANA recebe um espelho por `MERGE`, mas o banco principal do produto continua sendo o SQLite
- por padrao, o sync nao envia `user_credentials` nem `auth_sessions`
- se precisar incluir tabelas sensiveis conscientemente, use `--include-sensitive`
- para limitar o sync a tabelas especificas, use `--tables=users,report_catalog,report_engagement_metrics`

## Prisma no projeto

- schema Prisma em `server/prisma/schema.prisma`
- config Prisma em `server/prisma.config.ts`
- client gerado em `server/src/generated/prisma`
- helper singleton em `server/src/db/prisma.ts`

Uso recomendado:

- manter o runtime atual baseado em `connection.ts` para os fluxos ja consolidados
- usar Prisma para novas consultas tipadas, exploracao do banco e Prisma Studio
- antes de usar um model no Prisma Client, conferir se ele nao ficou com `@@ignore` apos o `prisma db pull`

Observacao importante:

- varias tabelas existentes nao possuem identificador unico valido para o Prisma Client e, por isso, ficam introspectadas com `@@ignore`
- isso nao quebra o sistema atual
- significa apenas que essas tabelas ainda devem continuar sendo acessadas pelo runtime SQL existente ou ser remodeladas no futuro se a equipe quiser migrar mais partes para Prisma

## Responsabilidades principais

- autenticacao e sessoes
- cadastro de usuarios e credenciais
- aprovacao e catalogo de relatorios
- busca global
- chatbot, sessoes, mensagens e cache semantico
- exclusao definitiva de relatorios sem vazamento para dashboard, busca ou chatbot

## Arquivos centrais

- `src/config/env.ts`
- `src/db/connection.ts`
- `src/db/migrate.ts`
- `src/vectorstore/storeResolver.ts`
- `src/vectorstore/sqliteVectorStore.ts`
- `src/routes/searchRoutes.ts`
- `src/services/superadminService.ts`
- `src/services/reportApprovalService.ts`

## Observacoes

- Esta branch esta preparada para rodar localmente com SQLite como fonte principal de verdade.
- Se o time voltar a avaliar outro banco no futuro, a documentacao deve ser reaberta explicitamente em nova branch.
