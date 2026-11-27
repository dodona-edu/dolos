# Self-hosting the Dolos web app

If you do not want to use our free to use instance ([dolos.ugent.be/server](https://dolos.ugent.be/server)),
it is also possible to host your own instance.

## Hosting with Docker Compose

[Docker](https://www.docker.com/) is a containerization technology that allows you to run our service without the hassle of installing the different dependencies and services yourself.
The file `docker-compose.yml` runs each part of Dolos in its own container:

- `proxy`: a [Caddy](https://caddyserver.com/) reverse proxy. It is the only service that is reachable from outside. It serves the frontend and the API on one host name, and gets an HTTPS certificate for that host name.
- `web`: the frontend, as static files.
- `api`: the API server.
- `worker`: the job worker. It starts a container of the Dolos CLI for each analysis.
- `cli`: the image of the Dolos CLI. This service only pulls the image and checks that it runs. It stops after the check.
- `db`: the MariaDB database.

The database and the stored datasets and reports are in the named volumes `dolos-db-data` and `dolos-api-storage`.
The certificates of the proxy are in the volume `dolos-proxy-data`.

### On a server

You need a server with a domain name, for example `dolos.example.com`.
Ports 80 and 443 of the server must be reachable from the internet: Caddy uses them to get a certificate from [Let's Encrypt](https://letsencrypt.org/).

1. Install [Git](https://git-scm.com/downloads), [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/).
2. Clone the repository with Git and enter the new directory:
   ```sh
   git clone https://github.com/dodona-edu/dolos.git
   cd dolos/
   ```
3. Create the configuration file from the template: `cp .env.example .env`.
4. Edit `.env`:
   - Set `DOLOS_PROTOCOL=https` and set `DOLOS_HOST` to the domain name of the server.
   - Set `DATABASE_PASSWORD` to the output of `openssl rand -hex 32`.
   - Set `SECRET_KEY_BASE` to the output of `openssl rand -hex 64`.
5. Run `docker compose pull` to get the images.
6. Run `docker compose up --detach` to start the services.

Dolos is now available on `https://dolos.example.com`.

The images use the release in `DOLOS_VERSION`. To update Dolos, change `DOLOS_VERSION` in `.env`, then run `docker compose pull` and `docker compose up --detach` again.

### On your own computer

Keep `DOLOS_PROTOCOL=http` and `DOLOS_HOST=localhost` in `.env`, and set the two secrets as described above.
Then run `docker compose pull` and `docker compose up`.
Dolos is now available on <http://localhost>. Port 80 must be free.

::: warning

The Dolos web app launches a new docker container for each analysis.
For this reason, **we mount the docker socket** (`/var/run/docker.sock`) in the worker container.

This grants the worker full control over your docker instance.

:::

### Configuration

All configuration is in the `.env` file:

- `DOLOS_VERSION`: the release of the Dolos images, for example `3.0.0`.
- `DOLOS_PROTOCOL`: `https` on a server, `http` on your own computer.
- `DOLOS_HOST`: the host name of Dolos in the browser.
- `DATABASE_USER` and `DATABASE_PASSWORD`: the user of the database.
- `SECRET_KEY_BASE`: the secret of the API server.
- `DOCKER_SOCKET`: the Docker socket on the host. For a rootless Docker setup, use `${XDG_RUNTIME_DIR}/docker.sock`.

The worker and the CLI containers exchange files through the directory `/tmp/dolos` on the host.

The setup of Dolos 2 used other variables (`WEB_PROTOCOL`, `FRONTEND_*`, `API_*` and `DATABASE_ROOT_PASSWORD`).
To upgrade, create `.env` again from `.env.example`. The volumes keep their names.

### Build the images yourself

Run `docker compose build` to build the images from your clone of the repository instead of pulling them.
The build needs [BuildKit](https://docs.docker.com/build/buildkit/), which `docker compose` uses by default when the Docker Buildx plugin is installed.

## Hosting without Docker Compose

The Docker image of the frontend calls the API on the same host name as the frontend, on the paths `/reports`, `/datasets` and `/rails`.
When you build the frontend yourself, set `VITE_API_URL` to the URL of the API.

### Configurable environment variables

Please refer to the documentation of the `dolos-api` and `dolos-web` components for information how to build and setup the API and front-end.

Below is a list of configurable environment variables:

#### Dolos web
Environment variables of the `dolos-web` service (the front-end web UI):

- `VITE_API_URL`: full URL (format: `https://{hostname}:{port}`) where the API service is hosted
- `VITE_MODE`: should be `server` to build for the web app_

#### Dolos API 
Environment variables of the `dolos-api` service (the API server):

- `DOLOS_API_URL`: full URL where Dolos API will be hosted, including the subdirectory (e.g. `http://localhost:3000/api`)
- `DOLOS_API_FRONT_END_URL`: full URL where the front-end is hosted (format: `https://{hostname}:{port}`)
- `DOLOS_API_DATABASE_{HOST,USERNAME,PASSWORD}`: hostname, username and password of the database server (MariaDB or MySQL)

::: info

When hosting the Dolos API **on a subdirectory** (for example: `/api/`) using Docker behind a reverse proxy (**nginx**, **apache**, **haproxy**), there is currently a bug where Rails is generating incorrect URL's not respecting this subdirectory.

See [issue#1523](https://github.com/dodona-edu/dolos/issues/1523) on GitHub for more information and possible workarounds.

:::
