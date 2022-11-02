{
  description = "Dolos source code plagiarism detection";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };
  outputs = {self,  nixpkgs, flake-utils, rust-overlay, ... }:
  flake-utils.lib.eachDefaultSystem (system:
  let
    overlays = [ (import rust-overlay) ];
    pkgs = import nixpkgs {
      inherit system overlays;
    };
  in
  with pkgs;
  {
    devShell = let
      rust = rust-bin.stable.latest.default.override {
        extensions = [ "rust-src" ];
      };
    in mkShell {
      buildInputs = [
        rust
        cargo-watch
        cargo-limit
      ];
      shellHook = let
        rev = rust.name;
        versionFile = ".dev/version.rev";
      in ''
        mkdir -p .dev
        echo "Checking..."
        if [[ -f ${versionFile} && "${rev}" = "$(cat ${versionFile})" ]]; then
          echo "Rust version up to date"
        else
          rm -rf .dev/*
          cp -r ${rust} .dev/rust
          cp -r ${rust-bin.stable.latest.rust-src} .dev/rust-src
          chmod u+w -R .dev/
          echo "${ rev }" > ${versionFile}
          echo "Rust version updated to ${rev}"
        fi
      '';
    };
  });
}
