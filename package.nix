{ lib
, buildNpmPackage
, jq
, unzip
}:
buildNpmPackage rec {
  pname = "dolos";
  version = "2.9.3";

  src = ./.;

  npmDepsHash = "sha256-phMwMncdToAmyVbYL1H0KbnRmlcC73EU16V1ooNdA0c=";

  npmWorkspace="cli";

  npmFlags = [ "--legacy-peer-deps" ];

  makeWrapperArgs = "--prefix PATH : ${lib.makeBinPath [ unzip ]}";

  makeCacheWritable = true;

  prePatch = ''
    test -f parsers/bash/binding.gyp || (echo -e "\n    Submodules are not present, run flake with '.?submodules=1'\n" && exit 1)
  '';

  postPatch = ''
    ${jq}/bin/jq -r 'del(.devDependencies) | del(.scripts.prepare)' parsers/package.json > package.json.tmp
    mv package.json.tmp parsers/package.json
  '';

  buildInputs = [ unzip ];

  buildPhase = ''
    # Build each needed workspace
    for dir in core parsers lib web cli; do
        echo "Building dolos-$dir"
        npm --workspace="$dir" run build
    done
  '';

  # Some symlinks from cli are still broken
  dontCheckForBrokenSymlinks = true;

  postInstall = ''
    for dir in core parsers lib web; do
        # npm creates a symlink to each dependent workspace in node_modules
        # overwrite each link with that workspace's build output (with npm pack)
        local module="$packageOut/node_modules/@dodona/dolos-$dir"
        rm "$module"
        while IFS= read -r file; do
            local dest="$module/$(dirname "$file")"
            mkdir -p "$dest"
            cp "$dir/$file" "$dest"
        done < <(${jq}/bin/jq --raw-output '.[0].files | map(.path | select(. | startswith("node_modules/") | not)) | join("\n")' <<< "$(npm_config_cache="$HOME/.npm" npm pack --json --dry-run --loglevel=warn --no-foreground-scripts --workspace="$dir")")
    done

    # Some CLI runtime dependencies can remain workspace-local and not be present
    # in the packaged node_modules tree (e.g. cliui after version bumps).
    # Copy any missing modules from cli/node_modules into the final package.
    if [ -d cli/node_modules ]; then
      for module in cli/node_modules/* cli/node_modules/@*/*; do
        if [ ! -e "$module" ]; then
          continue
        fi
        rel=$(printf '%s' "$module" | sed 's#^cli/node_modules/##')
        dest="$packageOut/node_modules/$rel"
        if [ -e "$dest" ]; then
          continue
        fi
        mkdir -p "$(dirname "$dest")"
        cp -rL "$module" "$dest"
      done
    fi

    # dolos-parsers does not include the built parsers with npm pack, copy them
    cp -r parsers/build "$packageOut/node_modules/@dodona/dolos-parsers"
  '';

}
