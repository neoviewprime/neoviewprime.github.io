#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f ".env" ] && [ -f ".env.codespaces.example" ]; then
  cp ".env.codespaces.example" ".env"
fi

mkdir -p server
if [ ! -f "server/.env" ] && [ -f "server/.env.codespaces.example" ]; then
  cp "server/.env.codespaces.example" "server/.env"
fi

npm install
npm --prefix server install

echo "NeoView Codespaces setup concluido."
echo "Para iniciar em modo dev no Codespaces: npm run dev:codespaces"
