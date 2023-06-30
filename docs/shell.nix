{ pkgs ? import <nixpkgs> {}, system ? builtins.currentSystem, ... }:
let
  dev = fetchTarball "https://github.com/chvp/devshell/archive/main.tar.gz";
  devshell = pkgs.devshell or (import dev { inherit system; });
in devshell.mkShell {
  name = "Dolos docs - dolos.ugent.be";
  packages = with pkgs; [
    nodejs
    yarn
  ];
  commands = [
    {
      name = "dev";
      help = "Run development server";
      command = "yarn dev";
    }
  ];
}
