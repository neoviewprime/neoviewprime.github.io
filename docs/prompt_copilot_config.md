# Prompt Copilot Config

Use o texto abaixo no GitHub Copilot Chat quando a tarefa for configurar ou evoluir este projeto com SQLite como banco principal e acesso por `IP:3389`.

```text
Voce esta trabalhando no projeto NeoView. Quero que voce configure ou evolua o projeto atual mantendo SQLite como banco principal, com o minimo de mudancas necessario.

Antes de propor ou editar qualquer coisa, leia primeiro estes arquivos:
- docs/SQLITE_COPILOT.md
- docs/SQLITE_IMPLEMENTACAO.md
- .github/copilot-instructions.md
- server/.env.example
- server/src/config/env.ts
- server/src/db/connection.ts
- server/src/db/migrate.ts
- server/src/server.ts
- server/src/routes/authRoutes.ts
- server/src/routes/reportRoutes.ts
- server/src/routes/userRoutes.ts
- server/src/routes/searchRoutes.ts
- server/src/services/userManagementService.ts
- server/src/services/superadminService.ts
- server/src/services/reportApprovalService.ts
- server/src/vectorstore/storeResolver.ts
- server/src/vectorstore/sqliteVectorStore.ts
- server/README.md
- src/pages/Login.tsx
- src/pages/Settings.tsx
- src/pages/Reports.tsx
- src/components/GlobalSearch.tsx
- src/components/analytics/ChartBuilder.tsx
- src/components/analytics/ChartPreview.tsx

Fonte de verdade:
- trate `server/` como fonte de verdade para comportamento de banco, chatbot e vetor
- se houver conflito entre docs antigas e implementacao atual, siga a implementacao atual

Objetivo:
- manter o backend apto a rodar com `DB_PROVIDER=sqlite`
- usar SQLite como banco principal
- usar `VECTOR_PROVIDER=sqlite` como caminho preferencial para embeddings, cache semantico e busca vetorial
- manter `VECTOR_PROVIDER=chromadb` apenas como alternativa opcional
- preservar acesso externo por IP da maquina + porta 3389
- preservar frontend e backend funcionando juntos quando rodar `npm run start`
- nao migrar para Python

Regras obrigatorias:
- nao assumir HANA, PostgreSQL ou Supabase como backend principal
- nao mexer no frontend sem necessidade real
- nao inventar arquitetura nova
- nao quebrar o modo de acesso por `IP:3389`
- nao reintroduzir a aba `Cadastro` apos login
- manter a base local em `server/data/neoview.sqlite`

Variaveis que devem ser consideradas no setup:
- `DB_PROVIDER=sqlite`
- `DB_CLIENT=sqlite`
- `SQLITE_PATH`
- `VECTOR_PROVIDER=sqlite`
- `JWT_SECRET`
- `CLIENT_URL`
- `HOST`
- `PORT`

Regras de negocio ja implementadas e que devem ser respeitadas:
- login apenas com matricula U ou e-mail cadastrado
- senha inicial de superusuario: `neoview2026`
- troca de senha em `Configuracoes`
- exclusao definitiva de relatorios permitida para `Gestor` ou acima e superusuarios
- pagina `Estatisticas` com grafico de pizza real
- pagina `Estatisticas` com grafico de area real
- paleta de metricas sem dois verdes; `shares` deve ficar em cinza
- pagina `Estatisticas` com fluxo guiado para bloco `Grafico em branco`
- aba `Cadastro` removida do menu autenticado
- exclusao definitiva de relatorios deve impedir que o chatbot continue encontrando o relatorio apagado
- a busca global deve usar dados reais e abrir o dashboard correto da hierarquia do relatorio

O que voce deve fazer:
1. Ler os arquivos listados
2. Dizer se a configuracao atual esta completa, parcial ou inconsistente
3. Ajustar apenas o que for necessario para backend, banco, autenticacao, relatorios, busca, chatbot e estatisticas funcionarem bem com SQLite
4. Preferir mudancas em:
   - `server/src/config/*`
   - `server/src/db/*`
   - `server/src/vectorstore/*`
   - `server/src/routes/*`
   - `server/src/services/*`
   - `src/pages/*`
   - `src/components/*`
   - documentacao em `docs/` e `server/README.md`
5. Se editar variaveis de ambiente, alinhar com `server/.env.example`
6. Ao terminar, listar:
   - arquivos alterados
   - motivo tecnico de cada ajuste
   - como validar
   - riscos restantes

Formato de resposta esperado:
1. Diagnostico atual
2. Mudancas propostas
3. Arquivos alterados
4. Como validar
5. Riscos restantes

Se precisar escolher entre caminhos:
- prefira `VECTOR_PROVIDER=sqlite` como padrao
- use `VECTOR_PROVIDER=chromadb` so se houver necessidade explicita
- prefira `npm run start` quando a meta for compartilhar internamente pela rede local

Se a tarefa for de implementacao:
- faca mudancas minimamente invasivas
- preserve o comportamento atual do produto sem reintroduzir outro banco como principal
- compile ou valide o backend ao final, se possivel

Agora comece analisando o estado atual do projeto para SQLite e ambiente corporativo, e implemente o essencial com baixa margem de erro.
```

## Versao Curta

Se quiser um comando menor para iniciar a conversa:

```text
Configure este projeto para uso com SQLite como banco principal. Leia primeiro docs/SQLITE_COPILOT.md, docs/SQLITE_IMPLEMENTACAO.md, .github/copilot-instructions.md, server/.env.example, server/src/server.ts, os arquivos de `server/src/db`, `server/src/routes`, `server/src/services` e os componentes principais de login, configuracoes, relatorios, busca e estatisticas. Trate `server/` como fonte de verdade, use `DB_PROVIDER=sqlite`, preserve o acesso por IP da maquina + porta 3389 e faca apenas o essencial sem refatoracao desnecessaria.
```
