# Self-hosting the Dolos web app

If you do not want to use our free to use instance ([dolos.ugent.be/server](https://dolos.ugent.be/server)),
it is also possible to host your own instance.

## Local hosting using Docker Compose

These instructions are for **local** hosting only. The section [external hosting](#external-hosting) explains how you create a public instance of Dolos.

[Docker](https://www.docker.com/) is a containerization technology that allows you to run our service without the hassle of installing the different dependencies and services yourself.


Run Dolos on your own system using these instructions:

1. Ensure [Git](https://git-scm.com/downloads), [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed on the system where you will be running Dolos on.
2. In a terminal, clone the Docker repository with Git and enter the new directory
  ```
    git clone https://github.com/dodona-edu/dolos.git
    cd dolos/
  ```
3. Run `cp .env.example .env` to create a copy of the template environment settings.
3. Run `docker compose pull` in this directory to pull and fetch all needed container images.
4. Run `docker pull ghcr.io/dodona-edu/dolos-cli:latest` to ensure the container running the Dolos CLI is present and up-to-date.
5. Run `docker compose up` to start the services.

You can now visit the web app running locally on <http://localhost:8080>.
The API is available on <http://localhost:3000>. By changing the entries in the `.env` file, it is possible to change the ports on which Dolos is hosted - these are the settings `FRONTEND_EXTERNAL_PORT` and `API_EXTERNAL_PORT`. After such changes, make sure to run `docker compose up` again to apply.

::: warning

The Dolos web app launches a new docker container for each analysis.
For this reason, **we mount the docker socket** (`/var/run/docker.sock`) in the `docker-compose.yml` configuration.

This grants the web app full control over your docker instance.

:::

## External hosting

To host your own public instance of Dolos, you will need some extra security precautions that are not included in the default `docker-compose.yml` configuration:
- **configure a domain name** and subdomain or path for the API
- **configure HTTPS**
- **configure serving static files** for the front-end Web UI

This is typically handled by using a reverse proxy like Nginx, Apache, Traefik, ... 

As this configuration is highly dependent on your situation, we recommend [contacting us](/about/contact) describing what you want to achieve.

### Running Docker Compose behind a reverse proxy

The provided Docker Compose configuration provides some basic provisions to run Dolos behind a reverse proxy, which should be set up separately. After setting up the reverse proxy, you should customise the `.env` settings. For these instructions, we assume we want to host Dolos on `https://foo.example.com/` and the API on `https://foo.example.com/api`.

- `WEB_PROTOCOL` should be set to `https` (assuming the reverse proxy has this set up)
- The three `DATABASE_*` fields should be changed to more secure values
- The `FRONTEND_EXTERNAL_*` fields should correspond to the public endpoint of your Dolos instance. In this case, `_HOST` would be `foo.example.com`, `_PORT` would be `443` (public HTTPS), and `_PATH` can be left empty.
- `FRONTEND_INTERNAL_HOST` should be the IP address where your reverse proxy is located, typically `127.0.0.1`. This prevents external users from bypassing the revervse proxy: only the proxy can contact Dolos.
- `FRONTEND_INTERNAL_PORT` should be set to the port that your reverse proxy will be using to contact Dolos. This is different from the external port.
- The `API_*` fields should be set up in the same way as the `FRONTEND_` fields before, but now you should provide `_PATH` as `/api`.

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
