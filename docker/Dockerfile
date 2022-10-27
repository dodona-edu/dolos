FROM node:16-alpine3.16
ARG dolos_version=2.0.0

# node-gyp needs python3 and a compiler to build tree-sitter
RUN apk --no-cache add python3 build-base &&\
    npm -g install @dodona/dolos@$dolos_version &&\
    apk --no-cache del python3 build-base

EXPOSE 3000/tcp
WORKDIR /dolos
ENTRYPOINT [ "dolos" ]
