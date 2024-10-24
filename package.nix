{ lib
, buildNpmPackage
, jq
, unzip
}:
buildNpmPackage rec {
  pname = "dolos";
  version = "2.7.1";

  srcs = [
    ./package.json
    ./package-lock.json
    ./tsconfig.global.json
    ./core
    ./parsers
    ./lib
    ./web
    ./cli
  ];

  unpackPhase = ''
    for src in $srcs; do
      cp -r $src ./$(stripHash $src)
      chmod -R 700 ./$(stripHash $src)
    done
  '';

  npmDepsHash = "sha256-XMATCZS/j5bcGjfUQnaFC2mPCv47+3tgIfruTYUQhN4=";

  npmWorkspace="cli";

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
    # dolos-parsers does not include the built parsers with npm pack, copy them
    cp -r parsers/build "$packageOut/node_modules/@dodona/dolos-parsers"
  '';

}
