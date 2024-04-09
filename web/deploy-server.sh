#!/usr/bin/env sh

export VITE_API_URL="https://dolos.ugent.be/api"
export BASE_URL="https://dolos.ugent.be/server"

rm -r dist/*
npm run build:server
rsync -glpPrtvz --delete dist/ dolos:dolos/server/
