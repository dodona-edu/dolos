# Install Dolos with Docker

We provide a [Docker image with the latest Dolos version installed](https://github.com/dodona-edu/dolos/pkgs/container/dolos)
through GitHub's container registry. You can pull the latest image with the
following command:
```shell
docker pull ghcr.io/dodona-edu/dolos:latest
```

## Running Dolos in Docker

The Docker container contains the Dolos program installed with `npm`, it has
the same CLI arguments shown in the section [Running Dolos](./running.html).

You do have to pass some extra arguments to Docker to work with the container:
- `-v "$PWD:/dolos"` gives Dolos acces to your current directory
- `--init` will make sure stopping the container with Control-C works
- `--network host` allows Dolos's webserver to bind to <http://localhost:3000>

For example: the command to analyze and view the samples shown in the section
[Running Dolos](./running.html) using the docker container is:

```shell
docker run --init --network host -v "$PWD:/dolos" \
    ghcr.io/dodona-edu/dolos -l javascript -f web *.js
```
