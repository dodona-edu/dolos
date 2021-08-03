#!/usr/bin/env sh

yarn build

rsync -glpPrtvz \
    -e 'ssh -p 4840' \
    .vuepress/dist/ \
    dodona@dolos.ugent.be:dolos/docs
