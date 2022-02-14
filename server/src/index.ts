import * as Eta from "eta";
import { default as express, Express } from "express";
import { default as fileUpload } from "express-fileupload";
import rateLimit from "express-rate-limit";
import { getConfig } from "./config/configuration";
import { router } from "./routes";

const env = getConfig();
const app: Express = express();
const port = env.port;
const host = env.host;

app.engine("eta", Eta.renderFile);
app.set("view engine", "eta");
app.set("views", "./views");
app.use(fileUpload({
  useTempFiles: true,
  createParentPath: true,
  safeFileNames: true,
  abortOnLimit: true,
  tempFileDir: "/tmp/dolos-uploads",
}));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(env.baseURI, router);


app.listen(port, () => {
  console.log(`Dolos-server is listening on http://${host}:${port}`);
});
