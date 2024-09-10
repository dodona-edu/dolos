{ lib
, mkYarnPackage
, nodejs
, pkg-config
}:
let
  package-json = lib.importJSON ./package.json;
in mkYarnPackage {
  inherit (package-json) name version;
}
