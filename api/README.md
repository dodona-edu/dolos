# Dolos API

This is the API server for Dolos.

It is a rails application that enables users to upload datasets, which will be analyzed with the Dolos CLI (running in a docker container) and the results will be available on a secret URL.

Refer to the installation instructions in the root of this repository how to self-host a fully working Dolos web app.

## Development

The next steps will guide you through the installation process to start developing:

### 1. Installation

This is a Rails 7 running on Ruby 3. We use a MariaDB / MySQL database and have a `delayed_job` job worker that will spawn docker containers.

#### Using Nix

If you have [Nix installed](https://nixos.org/download.html#download-nix), you can use the provided `flake.nix` to get a shell with all dependencies (except docker) using with the following command:

```bash
nix develop    # provides a shell with all dependencies
bundle install # conventionally install ruby dependencies
```

The flake also provides the command `server:start` to start the database and job worker services. However, you need to set up the database first (see step 2). 

#### Using docker-compose

The `docker-compose.yml` in this directory will start the development API server, job worker and MySQL database.
You can start this environment with `docker-compose up`.

**Note:** the job worker needs access to spawn new docker containers, the docker daemon socket (`unix:///var/run/docker.sock`) will be mounted in the worker service.


#### Using your own environment

If you want to use your own environment, you will need to install the following dependencies:
- The correct version of Ruby (see `.ruby-version`)
- MySQL or MariaDB (see `config/database.yml`)
- Docker

You will also need to install the dependencies with `bundle install` and the job worker with `rails jobs:work`.

### 2. Database setup

You only really need to run one command: `rails db:prepare`. This will create the database, run all migrations and run the seeds (if any). 

Useful commands that you might need to perform these steps manually:
- `rails db:create` will create the database
- `rails db:migrate` will run migrations
- `rails db:seed` will run seeds
- `rails db:drop` will drop the database (all data will be lost)

### 3. Running the server and worker

You can start the server with `rails server`. This will start the API server on http://localhost:3000.

To be able to analyze datasets, you need to have the latest image of the Dolos docker

```bash
docker pull ghcr.io/dodona-ede/dolos:latest
```

You can start the job worker with `rails jobs:work`.
This will start the job worker and will spawn docker containers to analyze datasets once they are uploaded.

### 4. Running the frontend

To interact with the API server you should run the `dolos-web` front-end in _server mode_.
Refer to the instructions in the `web/` directory of this repository.

## Hosting Dolos API

You can also run the Ruby on Rails application directly without the use of docker-compose.

System requirements:
- Ruby (see `.ruby-version`)
- A MariaDB or MySQL database
- Docker Engine
- Recommended: a reverse proxy (Nginx, Apache, ...)

This application is deployed using capistrano.
You can deploy the application with `cap production deploy`.
