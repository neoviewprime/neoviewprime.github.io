# NeoView Project Maintenance

## Objetivo

Este projeto foi organizado para manutencao assistida por GitHub Copilot sem depender de ajustes manuais dispersos em DBeaver ou em mocks soltos no frontend.

## Fluxos oficiais

### Subir a aplicacao completa

Na raiz:

```bash
npm run dev
```

ou

```bash
npm run start
```

### Zerar o backend

Na raiz:

```bash
npm run reset:backend
```

Esse reset:

- limpa interacoes, aprovacoes, comentarios, likes, shares e sessoes
- remove relatorios gerados manualmente e seeds pendentes gerados pelo sistema
- recria o catalogo base a partir de `server/data/reports/catalog`
- repovoa os exemplos de pendencia usados pela aba `Validacoes`

## SQLite e inspecao local

- DBeaver ou DB Browser for SQLite podem ser usados para inspecao e diagnostico, nao como fluxo principal de correcao.
- O banco principal desta branch fica em `server/data/neoview.sqlite`.
- Se houver ajuste estrutural, o lugar correto e `server/src/db/migrate.ts`.
- Se houver comportamento diferente entre banco e aplicacao, o ponto principal e `server/src/db/connection.ts` e os services em `server/src/services/`.
- Para diretrizes operacionais atuais, consulte tambem `docs/SQLITE_IMPLEMENTACAO.md`.

## Onde mexer por tipo de demanda

### Bug de backend ou banco

- `server/src/routes/`
- `server/src/services/`
- `server/src/db/`
- `server/src/config/env.ts`

### Nova aba no frontend

- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/`

### Nova aba com persistencia

Atualize tambem:

- `server/src/db/migrate.ts`
- `server/src/routes/`
- `server/src/services/`
- `src/hooks/`
- `src/types/backend.ts`

### Resumo do Workspace

Se a nova funcionalidade representar interacao ativa do usuario, avalie refletir isso em:

- `src/pages/Workspace.tsx`

## Validacao minima antes de encerrar uma correcao

Frontend:

```bash
node .\\node_modules\\typescript\\bin\\tsc --noEmit
```

Backend:

```bash
node .\\server\\node_modules\\typescript\\bin\\tsc -p server\\tsconfig.json --noEmit
```
