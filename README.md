# NeoView

Plataforma web para visualizacao de indicadores, gestao de relatorios, aprovacoes e acompanhamento de interacoes em uma estrutura organizacional hierarquica.

## Estado atual da branch

- banco principal: SQLite
- arquivo local do banco: `server/data/neoview.sqlite`
- compartilhamento local: `http://IP_DA_MAQUINA:3389`
- stack mantida em React + TypeScript no frontend e Node.js + TypeScript no backend
- o fluxo `UTD's` da Neoenergia Coelba reutiliza o mesmo catalogo SQLite e nao exige migration extra

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind, shadcn/ui
- Backend: Node.js, Express, TypeScript
- Banco: SQLite

## Rodando o projeto

Na raiz:

```bash
npm.cmd install --no-audit --no-fund
npm.cmd run setup:zip
npm.cmd run dev
```

Se voce preferir manter o fluxo manual ao configurar outra maquina:

```bash
npm.cmd install --no-audit --no-fund
npm.cmd --prefix server install --no-audit --no-fund
cp .env.example .env
cp server/.env.example server/.env
npm.cmd run verify:setup
npm.cmd run dev
```

Para producao local:

```bash
npm.cmd run start
```

## Setup em outra maquina

Para baixar o ZIP do GitHub e subir sem quebrar:

1. Instale as dependencias da raiz com `npm.cmd install --no-audit --no-fund`.
2. Instale as dependencias do backend com `npm.cmd --prefix server install --no-audit --no-fund` ou rode `npm.cmd run setup:zip`.
3. Crie os arquivos `.env` e `server/.env` a partir dos exemplos, se eles nao existirem.
4. Rode `npm.cmd run verify:setup` antes de `npm.cmd run dev` ou `npm.cmd run start`.

Observacao:

- o projeto usa SQLite local em `server/data/neoview.sqlite`
- existe um `.npmrc` no repositorio com `audit=false` e `fund=false` para reduzir ruido em rede corporativa
- o `.gitignore` agora protege novos arquivos locais de ambiente e banco, mas arquivos ja versionados continuam no historico ate uma limpeza dedicada
- para uso em maquina nova, prefira sempre ajustar os `.env` locais em vez de confiar em valores antigos do repositorio

## Backend

Variaveis principais em `server/.env`:

```env
DB_PROVIDER=sqlite
DB_CLIENT=sqlite
SQLITE_PATH=data/neoview.sqlite
DATABASE_URL="file:./data/neoview.sqlite"
VECTOR_PROVIDER=sqlite
```

Para inicializar o banco manualmente:

```bash
npm --prefix server run migrate
```

Prisma tambem esta preparado sobre o mesmo SQLite para schema tipado e Studio:

```bash
npm --prefix server run prisma:pull
npm --prefix server run prisma:generate
npm --prefix server run prisma:studio
```

## Regras de negocio importantes

- login por matricula U ou e-mail cadastrado
- senha inicial de superusuario: `neoview2026`
- troca de senha disponivel em `Configuracoes`
- exclusao definitiva de relatorios para `Gestor` ou acima e superusuarios
- a aba `Cadastro` existe no fluxo de autenticacao, mas nao aparece no menu apos login
- a busca global usa dados reais da plataforma e abre o dashboard correto
- exclusao definitiva de relatorios tambem remove vestigios usados pelo chatbot

## Referencias para manutencao

- [.github/copilot-instructions.md](/c:/Users/Samsung/Desktop/Neoview/project-neoview/prime_version_neoview/.github/copilot-instructions.md)
- [docs/SQLITE_COPILOT.md](/c:/Users/Samsung/Desktop/Neoview/project-neoview/prime_version_neoview/docs/SQLITE_COPILOT.md)
- [docs/SQLITE_IMPLEMENTACAO.md](/c:/Users/Samsung/Desktop/Neoview/project-neoview/prime_version_neoview/docs/SQLITE_IMPLEMENTACAO.md)
- [docs/prompt_copilot_config.md](/c:/Users/Samsung/Desktop/Neoview/project-neoview/prime_version_neoview/docs/prompt_copilot_config.md)
- [server/README.md](/c:/Users/Samsung/Desktop/Neoview/project-neoview/prime_version_neoview/server/README.md)
