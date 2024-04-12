# Install Dolos CLI with Docker

The latest Dolos version comes pre-installed in a [Docker container image](https://github.com/dodona-edu/dolos/pkgs/container/dolos-cli)
that is available from GitHub's container registry.
Use the following commando to pull the image:

```shell
docker pull ghcr.io/dodona-edu/dolos-cli:latest
```

## Run Dolos CLI in Docker

The Docker container comes with a complete `npm`-installed Dolos CLI (latest version).
See the section on [Running Dolos](./running.html) to learn more about the available CLI arguments.

Running Dolos from the Docker container requires some additional arguments:

- `-v "$PWD:/dolos"` gives Dolos access to your current directory
- `--init` assures that the container can be stopped with Control-C
- `--network host` allows Dolos's webserver to bind to <http://localhost:3000>

Here is, for example, a containerized version of the command from the [Running Dolos](./running.html) tutorial
to run a plagiarism detection analysis and open an interatie web app where the analysis results can be explored:

```shell
docker run --init --network host -v "$PWD:/dolos" ghcr.io/dodona-edu/dolos-cli -l javascript -f web *.js
```

:::: tip
To avoid binding of the docker container to the host network, 
omit the `--network host` argument from **docker**
and add pass `--host 0.0.0.0` to **dolos**.
You can then visit the interactive web app at the IP address or hostname of the docker container.
::::
