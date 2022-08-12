{
  description = "Dolos API";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devshell = {
      url = "github:numtide/devshell";
      inputs = {
        flake-utils.follows = "flake-utils";
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs = { self, nixpkgs, devshell, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; overlays = [ devshell.overlay ]; };
        gems = pkgs.bundlerEnv rec {
          name = "dolos-api-env";
          ruby = pkgs.ruby_3_1;
          gemfile = ./Gemfile;
          lockfile = ./Gemfile.lock;
          gemset = ./gemset.nix;
          groups = [ "default" "development" "test" "production" ];
        };
      in
      {
        packages = rec {
          default = dolos-api;
          dolos-api = pkgs.stdenv.mkDerivation rec {
            pname = "dolos-api";
            version = "0.1.0";

            src = pkgs.lib.cleanSourceWith { filter = name: type: !(builtins.elem name [ ".github" "flake.lock" "flake.nix" ]); src = ./.; name = "source"; };

            installPhase = ''
              mkdir $out
              cp -r * $out
            '';

            passthru.env = gems;
          };
        };

        devShells = rec {
          default = dolos-api;
          dolos-api = pkgs.devshell.mkShell {
            name = "Dolos API";
            packages = [
              gems
              (pkgs.lowPrio gems.wrappedRuby)
              pkgs.nixpkgs-fmt
              pkgs.mariadb_108
            ];
            env = [
              {
                name = "DATABASE_ROOT_PASSWORD";
                eval = "dolos";
              }
              {
                name = "TEST_DATABASE_URL";
                eval = "mysql2://root:dolos@127.0.0.1:3306/dolos_test";
              }
              {
                name = "DATABASE_URL";
                eval = "mysql2://root:dolos@127.0.0.1:3306/dolos";
              }
            ];
            commands = [
              {
                name = "db:start";
                category = "database";
                help = "Start database docker";
                command = ''
                  trap "systemd-run --user docker stop dolos-db" 0
                  docker run --name dolos-db -p 3306:3306 --rm -v dolos-db-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=$DATABASE_ROOT_PASSWORD mariadb:latest &
                  wait
                '';
              }
              {
                name = "db:console";
                category = "database";
                help = "Open database console";
                command = ''
                  docker exec -i dolos-db mysql -uroot -p"$DATABASE_ROOT_PASSWORD"
                '';
              }
              {
                name = "gems:update";
                category = "dependencies";
                help = "Update the `Gemfile.lock` and `gemset.nix` files";
                command = ''
                  ${pkgs.ruby_3_1}/bin/bundle lock
                  ${pkgs.bundix}/bin/bundix
                '';
              }
            ];
          };
        };
      }
    );
}
