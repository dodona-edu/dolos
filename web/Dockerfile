FROM node:20.13.1-alpine3.18

WORKDIR /web/

ADD public/ /web/public
ADD src/ /web/src
ADD index.html index.d.ts index.js package.json tsconfig.json tsconfig.node.json vite.config.ts /web/

RUN npm install && apk add --no-cache curl

ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=8080
ENV VITE_API_URL=http://localhost:3000
ENV VITE_MODE=server
EXPOSE 8080/tcp

RUN npm run build

CMD npm run preview -- --host "$VITE_HOST" --port "$VITE_PORT" --strictPort
