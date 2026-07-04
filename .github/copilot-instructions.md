# NeoView Copilot Instructions

This repository contains a React frontend and a Node.js/TypeScript backend using SQLite as the primary database in the current branch.

## Priority context

- Treat `server/` as the source of truth for runtime behavior.
- Prefer SQLite-compatible code whenever the task touches SQL, migrations, repository logic, reports, approvals, or chatbot persistence.
- Keep frontend examples aligned with the backend contract defined in `server/src/routes/`, `server/src/services/`, and `src/types/backend.ts`.
- Preserve the current local sharing flow through `npm run start` and `IP:3389`.

## Database rules

- The backend runtime is SQLite-first via `server/src/config/env.ts`.
- Keep `DB_PROVIDER=sqlite` and `DB_CLIENT=sqlite` aligned.
- Use `SQLITE_PATH` as the local database file location.
- Keep `DATABASE_URL` aligned with the same SQLite file for Prisma.
- Do not reintroduce HANA or PostgreSQL as the primary database in this branch.

## Prisma guidance

- Prisma is configured on top of the same SQLite file in `server/prisma/schema.prisma`.
- Use `server/src/db/prisma.ts` for new typed Prisma queries when that is helpful.
- Do not point Prisma to a separate `dev.db`.
- Do not assume every table is available in Prisma Client; some introspected tables are `@@ignore` because they lack a valid unique identifier.
- Preserve the existing SQL runtime for flows that Prisma cannot model cleanly yet.

## Vector search guidance

- `VECTOR_PROVIDER=sqlite` is the default built-in path for semantic cache and chunks.
- `VECTOR_PROVIDER=chromadb` remains valid when the team explicitly wants an external vector backend.
- If a change touches vector search, preserve compatibility with `server/src/vectorstore/chromaStore.ts` and `server/src/vectorstore/sqliteVectorStore.ts`.

## File targeting guidance

- Backend runtime: `server/src/config/env.ts`, `server/src/db/connection.ts`, `server/src/db/migrate.ts`
- Vector store: `server/src/vectorstore/storeResolver.ts`, `server/src/vectorstore/sqliteVectorStore.ts`
- Approvals and exclusions: `server/src/services/reportApprovalService.ts`, `server/src/services/superadminService.ts`
- Search and chatbot: `server/src/routes/searchRoutes.ts`, `src/components/GlobalSearch.tsx`, `src/components/Chatbot/ChatSources.tsx`

## Product behavior to preserve

- login by matricula U or e-mail
- `Login / Cadastro` on the authentication screen
- no `Cadastro` tab in the authenticated sidebar
- real global search using platform data
- permanent report deletion with no leak into dashboard, search, or chatbot
