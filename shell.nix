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
    # Browsers for the web package's Playwright visual harness. On NixOS the
    # npm-downloaded browser binaries can't run (missing FHS libs), so we use
    # the nixpkgs-provided browsers and point Playwright at them via the env
    # vars below. Keep @playwright/test in web/package.json pinned to the same
    # version as this driver (currently 1.54.1) or the browser lookup fails.
    playwright-driver.browsers
  ];
  env = [
    {
      name = "PYTHON";
      eval = "${pkgs.python3}/bin/python";
    }
    {
      name = "PLAYWRIGHT_BROWSERS_PATH";
      value = "${pkgs.playwright-driver.browsers}";
    }
    {
      name = "PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS";
      value = "true";
    }
    {
      name = "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD";
      value = "1";
    }
  ];
}
