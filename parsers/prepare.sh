#!/usr/bin/env sh

echo "Generating SQL parser (as they do not commit generated parsers)"
(cd sql && tree-sitter generate)
