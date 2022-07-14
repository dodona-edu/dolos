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
      shellHook = ''
        mkdir .dev
        ln -sf ${rust} .dev/rust
        ln -sf ${rust-bin.stable.latest.rust-src} .dev/rust-src
      '';
    };
  });
}
