FROM node:22.10.0-alpine3.19
ARG dolos_version=2.9.0

LABEL org.opencontainers.image.source https://github.com/dodona-edu/dolos

# node-gyp needs python3 and a compiler to build tree-sitter
RUN apk --no-cache add python3 build-base unzip &&\
    npm -g install @dodona/dolos@$dolos_version &&\
    apk --no-cache del python3 build-base

USER node
WORKDIR /dolos
EXPOSE 3000/tcp
ENTRYPOINT [ "dolos" ]
