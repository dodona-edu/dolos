# Dolos' docker image

This is the official docker image of the [Dolos project](https://dolos.ugent.be).

## How to use the docker image

You can run an analysis with Dolos and start a web server to view the results
using the following docker command:

```shell
docker run --init --network host -v "$PWD:/dolos" dodona/dolos -l javascript -f web *.js
```

The arguments passed to docker serve the following purpose:
- `--init` will make sure stopping the container with Control-C works
- `--network host` allows Dolos's webserver to bind to <http://localhost:3000>
- `-v "$PWD:/dolos"` gives Dolos acces to your current directory

