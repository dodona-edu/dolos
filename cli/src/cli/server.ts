import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import open from "open";
import { webroot } from "@dodona/dolos-web";

export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = "localhost";

export interface Options {
  port?: number;
  host?: string;
  open?: boolean;
}

const MIME: { [k: string]: string } = {
  "html": "text/html",
  "css": "text/css",
  "js": "text/javascript",
  "csv": "text/csv",
  "json": "text/json",
  "ttf": "font/ttf",
  "eot": "application/vnd.ms-fontobject",
  "woff": "font/woff",
  "woff2": "font/woff2"
};

function notFound(response: http.ServerResponse): void {
  response.writeHead(404, "Not found", { "Content-Type": "text/html" });
  response.end("File not found");
}

export default async function runServer(
  reportDir: string,
  options: Options
): Promise<void> {
  const port = options.port || DEFAULT_PORT;
  const host = options.host || DEFAULT_HOST;
  const openInBrowser = options.open == undefined ? true : options.open;
  const baseURL = `http://${ host }:${ port }`;
  const webDir = webroot();
  const server = http.createServer();

  server.on("request", (request, response) => {
    if (!request.url) {
      return notFound(response);
    }
    const reqPath = path.normalize(new URL(request.url, baseURL).pathname);

    let filePath;
    if (reqPath.startsWith("/data")) {
      filePath = path.join(reportDir, reqPath.slice(5));
    } else if (reqPath.endsWith("/")) {
      filePath = path.join(webDir, reqPath, "index.html");
    } else {
      filePath = path.join(webDir, reqPath);
    }
    const type = MIME[path.extname(filePath).slice(1)];
    if (!type) {
      return notFound(response);
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        notFound(response);
      } else {
        response.writeHead(200, { "Content-Type": type });
        response.end(data);
      }
    });
  });

  const serverStarted: Promise<void> = new Promise((r, e) => {
    server.on("listening", r);
    server.on("error", e);
  });
  const serverStopped: Promise<void> = new Promise((r, e) => {
    server.on("close", r);
    server.on("error", e);
  });

  server.listen(port, host);

  await serverStarted;
  console.log(`Dolos is available on ${ baseURL }`);

  if (openInBrowser) {
    // Open the URL in browser
    console.log("Opening the web page in your browser...");
    await open(baseURL, { wait: false });
  }

  console.log("Press Ctrl-C to exit.");
  return serverStopped;
}
