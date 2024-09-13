{ pkgs ? import <nixpkgs> { }, system ? builtins.currentSystem, ... }:
let
  dev = fetchTarball "https://github.com/numtide/devshell/archive/main.tar.gz";
  devshell = pkgs.devshell or (import dev { inherit system; });
  ruby = pkgs.ruby_3_3;
in
devshell.mkShell {
  name = "Dolos API server";
  imports = [
    "${devshell.extraModulesDir}/language/ruby.nix"
    "${devshell.extraModulesDir}/git/hooks.nix"
  ];
  git.hooks = {
    enable = true;
  };
  packages = with pkgs; [
    nixpkgs-fmt
    docker
    docker-compose
  ];
  language.ruby = {
    package = (pkgs.lowPrio ruby);
    nativeDeps = with pkgs; [ libmysqlclient libyaml ];
  };
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
  serviceGroups.server.services = {
    rails.command = "rails db:prepare && rails s -p 3000";
    worker.command = "rails jobs:work";
    mysql.command = "mysql";
  };
  commands = [
    {
      name = "mysql";
      category = "database";
      help = "Start database docker";
      command = ''
        trap "systemd-run --user docker stop dolos-db" 0
        docker run --name dolos-db -p 3306:3306 --rm -v dolos-db-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=$DATABASE_ROOT_PASSWORD mariadb:latest &
        wait
      '';
    }
    {
      name = "mysql-console";
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
        bundle install
        bundle pristine
        ${pkgs.bundix}/bin/bundix
      '';
    }
  ];
}
