# Self-hosting the Dolos web app

If you do not want to use our free to use instance ([dolos.ugent.be/server](https://dolos.ugent.be/server)),
it is also possible to host your own instance.

## Local hosting using docker-compose

These instructions are for **local** hosting only. The section [external hosting](#external-hosting-without-docker-compose) explains how you create a public instance of Dolos.

[Docker](https://www.docker.com/) is a containerization technology that allows you to run our service without the hassle of installing the different dependencies and services yourself.

::: info

The instructions below are for **Linux** and **MacOS** systems only.
[Contact us](/about/contact) if you want to run the Dolos web app on windows.

:::

Run Dolos on your own system using these instructions:

1. Ensure [Git](https://git-scm.com/downloads), [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed on the system where you will be running Dolos on.
2. Clone the Docker repository with Git and enter the new directory
  ```
    git clone https://github.com/dodona-edu/dolos.git
    cd dolos/
  ```
3. Run `docker-compose build` in this directory to pull and fetch all needed container images.
4. Run `docker pull ghcr.io/dodona-edu/dolos:latest` to ensure the container running the Dolos CLI is up-to-date.
5. Run `docker-compose up` to start the services.

You can now visit the web app running locally on <http://localhost:8080>.
The API is available on <http://localhost:3000>.

::: warning

The Dolos web app launches a new docker container for each analysis.
For this reason, **we mount the docker socket** (`/var/run/docker.sock`) in the `docker-compose.yml` configuration.

This grants the web app full control over your docker instance.

:::

## External hosting without docker-compose

To host your own public instance of Dolos, you will need some extra security precautions that are not included in the `docker-compose.yml` configuration:
- **configure a domain name** and subdomain or path for the API
- **configure HTTPS**
- **configure serving static files** for the front-end Web UI

This is typically handled by using a reverse proxy like Nginx, Apache, Traefik, ... 

As this configuration is highly dependent on your situation, we recommend [contacting us](/about/contact) describing what you want to achieve.

### Configurable environment variables

Please refer to the documentation of the `dolos-api` and `dolos-web` components for information how to build and setup the API and front-end.

Below is a list of configurable environment variables:

#### Dolos web
Environment variables of the `dolos-web` service (the front-end web UI):

- `VITE_API_URL`: full URL (format: `https://{hostname}:{port}`) where the API service is hosted
- `VITE_MODE`: should be `server` to build for the web app_

#### Dolos API 
Environment variables of the `dolos-api` service (the API server):

- `DOLOS_API_FRONT_END_URL`: full URL (format: `https://{hostname}:{port}`) where the front-end is hosted
- `DOLOS_API_HOSTS`: hostname and port of the API (format: `{hostname}:{port}`)
- `DOLOS_API_DISABLE_FORCE_SSL`: disables https when set to `true`. **Warning:** always use https when publicly hosting dolos.
- `DOLOS_API_DATABASE_{HOST,USERNAME,PASSWORD}`: hostname, username and password of the database server (MariaDB or MySQL)
