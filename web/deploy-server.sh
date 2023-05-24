#!/usr/bin/env sh

rm -r dist/*

export VUE_APP_API_URL="https://dolos.ugent.be/api"
yarn build:server

rsync -glpPrtvz --delete dist/ dolos:dolos/server/
