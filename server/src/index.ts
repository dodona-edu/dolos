import { default as express, Express } from "express";
import { default as fileUpload, UploadedFile } from "express-fileupload";
import * as Eta from "eta";
import { default as fs } from "fs";

const app: Express = express();
const port = 3000;
const reportsDir = __dirname + "/reports/";

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
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  const name = req.params.name;
  const destination = reportsDir + name;
  if (fs.existsSync(destination)) {
    return res.status(400).send('There is already a report with the same name.');
  }

  const zipfile = req.files.zip as UploadedFile;
  return zipfile.mv(destination + "/upload.zip", function(err: unknown) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.send("File uploaded");
  });
});

app.listen(port, () => {
  console.log(`Dolos-server is listening on http://localhost:${ port }`);
});
