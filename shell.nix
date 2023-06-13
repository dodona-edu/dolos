{ pkgs ? import <nixpkgs> { }, ... }:
pkgs.devshell.mkShell {
  name = "Dolos";
  packages = with pkgs; [
    nodejs
    yarn
    python3
    gcc
    gnumake
    tree-sitter
    nixpkgs-fmt
  ];
  env = [{
    name = "PYTHON";
    eval = "${pkgs.python3}/bin/python";
  }];
}
