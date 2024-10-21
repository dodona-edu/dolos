FROM node:22.10.0-alpine3.19

WORKDIR /web/

ADD public/ /web/public
ADD src/ /web/src
ADD index.html index.d.ts index.js package.json tsconfig.json tsconfig.node.json vite.config.ts /web/

RUN npm install && apk add --no-cache curl

ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=8080
ENV VITE_MODE=server
ENV DEFAULT_VITE_API_URL=http://localhost:3000
EXPOSE 8080/tcp

RUN VITE_API_URL="$DEFAULT_VITE_API_URL" npm run build


CMD (test "$VITE_API_URL" == "$DEFAULT_VITE_API_URL" || npm run build) && npm run preview -- --host "$VITE_HOST" --port "$VITE_PORT" --strictPort