# Self-hosting the Dolos web app

If you do not want to use our free to use instance ([dolos.ugent.be/server](https://dolos.ugent.be/server)),
it is also possible to host your own instance.

## Using docker-compose

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
2. _(Optional)_ The `docker-compose.yml` configuration is configured to run the web app on localhost only. If you want to host Dolos publicly, change the corresponding configuration in the compose file. [Contact us](/about/contact) if you need help how to do this.
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

## Without docker

It is also possible to install the Dolos web app without Docker Compose.

Please refer to the documentation of the `dolos-api` and `dolos-web` components in the repository how to do this or [get in touch with us](/about/contact).
