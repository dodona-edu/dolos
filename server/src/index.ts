import { default as express, Express } from "express";
import { default as fileUpload, UploadedFile } from "express-fileupload";
import * as Eta from "eta";
import { default as fs } from "fs";
import path from "path";
import { analyze } from "./analyzer";
import { reportsDir, resultFiles, sourceZipfileFolder, sourceZipName } from "./constants";
import { listReports } from "./reports";
import sanitize from "sanitize-filename";
import rateLimit from "express-rate-limit";

const app: Express = express();
const port = 3000;


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

app.get("/", async (_req, res) => {
  res.render("index", { reports: await listReports() });
});

app.post<{ name: string }>("/upload", async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.zip) {
    return res.status(400).send("No files were uploaded.");
  }

  const name = req.body.name;
  const sanName = sanitize(name);
  const destination = path.join(reportsDir, sanName, sourceZipfileFolder);

  if (fs.existsSync(destination)) {
    return res.status(400).send("There is already a report with the same name.");
  }

  const zipfile = req.files.zip as UploadedFile;
  await zipfile.mv(path.join(destination, sourceZipName));

  analyze(path.join(destination, sourceZipName));
  return res.status(202).send("File uploaded, will be analyzed. <a href='../'>Back to home</a>");
});

app.use("/reports/:reportname/data//:file/:fragment?", (req, res) => {
  const [sanReportName, sanFile, sanFragment] = [
    sanitize(req.params.reportname),
    sanitize(req.params.file),
    sanitize(req.params.fragment || "")
  ];

  const filePath = path.join(reportsDir, sanReportName, resultFiles, sanFile, sanFragment);
  res.sendFile(filePath);
});

app.use("/reports/:reportname", express.static(path.dirname(require.resolve("@dodona/dolos-web"))));

app.listen(port, () => {
  console.log(`Dolos-server is listening on http://localhost:${port}`);
});
