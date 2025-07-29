
# Dolos UI contributing guide

The `@dodona/dolos-web` project is arguably the most complex part of the Dolos ecosystem of projects supporting plagiarism detection.
This guide aims to set up developers with the required knowledge to start developing.

We welcome contributions to Dolos, but we do strongly recommend [contacting us](https://dolos.ugent.be/about/contact.html) first before starting on something.
We can discuss a good plan of action and let you know which parts of the code you should change.


## Technologies used


The UI uses the Vue.js (https://vuejs.org/) JavaScript framework for user interfaces.
Vue splits the code into multiple **components** that communicate through [reactivity](https://vuejs.org/guide/essentials/reactivity-fundamentals.html).
I strongly recommend looking at the "Getting started" page on their website, and maybe following the tutorial if you do not have experience using reactive web frameworks.
It is also good to know that we use their [Composition API](https://vuejs.org/guide/introduction.html#api-styles).

To ensure our UI is consistent, and to avoid implementing all components ourselves, we use [Vuetify.js](https://vuetifyjs.com/) which provides basic components (for example: Data Tables, navbars, buttons, ...).
The website of Vuetify has a page for the different components they offer and include examples and good documentation.

As Dolos is doing quite complex data manipulations and visualizations, we actually use [TypeScript](https://www.typescriptlang.org/) integrated with Vue (see [vue-ts](https://vuejs.org/guide/typescript/overview)) to check if we are using the correct types.
This adds a bit more complexity to your setup, but will help you catch errors and bugs faster during development and testing.

For the visualizations, we use D3 (https://d3js.org/), a very powerful and flexible library to build visualizations.
Using this library can also have a learning curve, especially if you are making a new visualization from scratch.
Luckily they have good documentation and many examples that you can use as inspiration.


## General code layout and conventions

We try to keep different parts of our code separated and modular, so we can re-use and change them easily.
These different modules are grouped together in folders, the most important ones are:

- [src/components](https://github.com/dodona-edu/dolos/blob/main/web/src/components/) contain the different UI components, grouped in directories based on what they are showing (e.g. files, submissions, ...), they usually communicate through reactive variables and the stores
- [src/api/stores](https://github.com/dodona-edu/dolos/blob/main/web/src/api/stores) has the [Pinia](https://pinia.vuejs.org/) store that keeps track of the global state of Dolos, these are responsible for fetching the report information and processing them
- [src/router](https://github.com/dodona-edu/dolos/blob/main/web/src/router/) contains the router that decides which view and/or component needs to be rendered
- [src/views](https://github.com/dodona-edu/dolos/blob/main/web/src/views/) and [src/layouts](https://github.com/dodona-edu/dolos/blob/main/web/src/layouts/)  contains the global layouts and views that launch the initial components
- [src/composables](https://github.com/dodona-edu/dolos/blob/main/web/src/composables/) contains the Vue [Composables](https://vuejs.org/guide/reusability/composables.html), these contain functionality that is required a lot (like tooltips) or that have a lot of JavaScript that would not belong in a component. For example: you will find the code responsible for rendering the Plagiarism Graph in [src/composables/d3/graph](https://github.com/dodona-edu/dolos/tree/main/web/src/composables/d3), which is then included within the components that use this graph ([src/components/graph/GraphCanvas.vue](https://github.com/dodona-edu/dolos/blob/main/web/src/components/graph/GraphCanvas.vue) and others).

Dolos UI has two modes:
- **analysis** mode (the default mode) that is used to visualise the results of one report
- **server** mode (used when the environment variable `VITE_MODE=server` is set) that is used as the UI for the Dolos web server, it has an upload form and can talk to the Dolos API

The mode in which the UI is built changes how the routing works, take a look at the router in [src/router](https://github.com/dodona-edu/dolos/blob/main/web/src/router/) for more information.

## Useful commands

Make sure you have cloned the repository recursively, because the `parsers` module needs the submodules to compile:

```shell
git clone --recursive git://github.com/dodona-edu/dolos.git

# or, if you have cloned the repository already:
git submodule update --init --recursive
```

Next, go to the **root directory** and ensure the npm dependencies are installed, up-to-date and the different modules are linked by running
```shell
# in the root directory:
npm install
```

Then make sure to build the dolos-core manually by going to the **core** directory and running
```shell
# in the core directory:
npm run build
```

When everything is set up, you can use the following commands during development:
- `npm run dev`: launches the Vite development server on http://localhost:8080 in analysis mode, it will already contain data of the Pyramidal constants demo
- `npm run dev:server`: launches the Vite development server on http://localhost:8080 in server mode. It will expect an API server running on http://localhost:3000. You can start the API server by following the instructions in the [api](../api) project.
- `npm run lint`: will run the linter
- `npm run check`: will perform a typechecks, this is not running by default when running `npm run dev`
- `npm run build`: builds the UI for production in analysis mode
- `npm run build:server` builds the UI for production in server mode
- `npm run preview`: will preview the UI by statically hosting the contents in the `dist/` folder

You can change the following environment variables to alter how the UI works:
- `VITE_API_URL` (default: http://localhost:3000) points to the Dolos API url
- `VITE_MODE` changes the mode (`server` or empty)

Note that `VITE_HOST` and `VITE_PORT` can be used to change where the [Docker container](../Dockerfile.web) will be hosted.
