{ pkgs ? import <nixpkgs> { }, ... }:
pkgs.devshell.mkShell {
  name = "Dolos";
  packages = with pkgs; [
    nodejs
    python3
    gcc
    gnumake
    tree-sitter
    nixpkgs-fmt
    docker
    docker-compose
  ];
  env = [{
    name = "PYTHON";
    eval = "${pkgs.python3}/bin/python";
  }];
}
