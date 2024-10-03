#!/usr/bin/env sh

# This script tests whether packaging Dolos with its different components works

# Run the current script in a docker container with a clean repository
exec time docker run -v "$PWD:/repo:ro" --rm --entrypoint="" node:22 \
  sh -c 'git config --global --add safe.directory /repo/.git && git clone --recursive --no-remote-submodules --shallow-submodules /repo /dolos && cd /dolos && tail -n+8 test_package.sh | sh -'

### Docker script starts here
set -e

npm install

for dir in core parsers lib web cli; do
  echo "=== Building and packing $dir ===="
  (cd $dir && npm run build && npm pack)
done

echo "=== Building and packing complete ===="

mkdir /test
cd /test
cp -r /dolos/samples .
cp /dolos/*/*.tgz .
rm -rf /dolos/

echo "=== Installing packs ===="

npm install -g *.tgz
npm ls -g --all '@dodona/dolos'

echo "=== Running Dolos ===="

dolos samples/javascript/simple-dataset.zip
