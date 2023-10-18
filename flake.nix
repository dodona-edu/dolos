{
  description = "Dolos - Source Code Plagiarism Detection";

  inputs = {
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.systems.follows = "systems";
    };
    devshell = {
      url = "github:numtide/devshell";
      inputs = {
        systems.follows = "systems";
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs = inputs@{ self, nixpkgs, devshell, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            devshell.overlays.default
            (self: super: {
              nodejs = super.nodejs_20;
            })
          ];
        };
      in
    {
      devShells = rec {
        default = dolos-general;
        dolos-general = import ./shell.nix { inherit pkgs system; };
        dolos-docs = import ./docs/shell.nix { inherit pkgs system; };
        dolos-api = import ./api/shell.nix { inherit pkgs system; };
      };
    }
  );
}
