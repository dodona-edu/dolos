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
    # Note that the Nix playwright driver version and the npm @playwright/test
    # package need to stay in sync, hence the version check at shell start.
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
    {
      name = "PLAYWRIGHT_NIX_VERSION";
      value = pkgs.playwright-driver.version;
    }
  ];
  devshell.startup.playwright-version-check.text = ''
    pw=$(find "$PRJ_ROOT" -maxdepth 5 \
        -path '*/node_modules/@playwright/test/package.json' \
        -not -path '*/.git/*' 2>/dev/null | head -n1)

    if [ -z "$pw" ]; then
      echo "ℹ️  @playwright/test not installed yet — install, then re-enter the shell with 'direnv reload'"
    else
      npmVer=$(node -p "require('$pw').version" 2>/dev/null)
      if [ "$npmVer" != "$PLAYWRIGHT_NIX_VERSION" ]; then
        echo "⚠️  playwright mismatch: nix=$PLAYWRIGHT_NIX_VERSION npm=$npmVer"
        echo "    fix: npm install -D -E @playwright/test@$PW_NIX_VERSION"
        echo
      fi
    fi
  '';
}
