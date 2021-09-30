import { default as express, Express } from "express";
import { default as fileUpload, UploadedFile } from "express-fileupload";
import * as Eta from "eta";
import { default as fs } from "fs";
import path from "path";
import { analyze } from "./analyzer";

const app: Express = express();
const port = 3000;
const reportsDir = path.join(__dirname, "../reports/");
const sourceZipfileFolder = "source"
const sourceZipName = "upload.zip";


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

app.get("/", (_req, res) => {
  res.render("index");
});

app.post<{name: string}>("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.zip) {
    return res.status(400).send('No files were uploaded.');
  }

  const name = req.body.name;
  const destination = path.join(reportsDir, name, sourceZipfileFolder);

  if (fs.existsSync(destination)) {
    return res.status(400).send('There is already a report with the same name.');
  }

  const zipfile = req.files.zip as UploadedFile;
  return zipfile.mv(path.join(destination, sourceZipName), function(err: unknown) {
    if (err) {
      return res.status(500).send(err);
    }
    analyze(path.join(destination, sourceZipName))
    return res.status(202).send("File uploaded, will be analyzed.");
  });
});

app.use("/reports/:reportname/data/*", (req, res) => {
  const filePath =  path.join(reportsDir, req.params.reportname, "results", req.originalUrl.replace(/^.*\/data\/\//, ""))
  res.sendFile(filePath);
});

app.use("/reports/:reportname", express.static(path.dirname(require.resolve("@dodona/dolos-web"))));




app.listen(port, () => {
  console.log(`Dolos-server is listening on http://localhost:${ port }`);
});
