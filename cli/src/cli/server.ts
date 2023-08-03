import { default as express, Express } from "express";
import http from "http";
import open from "open";
import { webroot } from "@dodona/dolos-web";

export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = "localhost";

export interface Options {
  port?: number;
  host?: string;
  open?: boolean;
}

export default async function runServer(
  reportDir: string,
  options: Options
): Promise<void> {
  const port = options.port || DEFAULT_PORT;
  const host = options.host || DEFAULT_HOST;
  const openInBrowser = options.open == undefined ? true : options.open;

  const app: Express = express();
  app.use("/data", express.static(reportDir));
  app.use(express.static(webroot()));

  const server = http.createServer(app);
  const serverStarted: Promise<void> = new Promise((r, e) => {
    server.on("listening", r);
    server.on("error", e);
  });
  const serverStopped: Promise<void> = new Promise((r, e) => {
    server.on("close", r);
    server.on("error", e);
  });

  server.listen(port, host);

  const url = `http://${ host }:${ port }`;

  await serverStarted;
  console.log(`Dolos is available on ${ url }`);

  if (openInBrowser) {
    // Open the URL in browser
    console.log("Opening the web page in your browser...");
    await open(url, { wait: false });
  }

  console.log("Press Ctrl-C to exit.");
  return serverStopped;
}
