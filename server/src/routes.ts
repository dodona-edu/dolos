import { Router, default as express } from "express";
import { UploadedFile } from "express-fileupload";
import path from "path";
import sanitize from "sanitize-filename";
import { analyze } from "./analyzer";
import { reportsDir, resultFiles, sourceZipfileFolder, sourceZipName } from "./constants";
import { default as fs } from "fs";
import { listReports } from "./reports";
import { getConfig } from "./config/configuration";


export const router = Router();

router.post<{ name: string }>("/upload", async (req, res) => {
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

  analyze(path.join(destination, sourceZipName), req.body.anonymize || false);
  return res.status(202).send("File uploaded, will be analyzed. <a href='./'>Back to home</a>");
});

router.use("/css", express.static(path.join(__dirname, "../css")));

router.get("/", async (_req, res) => {
  const config = getConfig();
  res.redirect(301, path.join(config.baseURI, "./upload-page"));
});


router.get("/upload-page", async (_req, res) => {
  res.render("index", { reports: await listReports() });
});


router.use("/reports/:reportname/data/:file/:fragment?", (req, res) => {
  const [sanReportName, sanFile, sanFragment] = [
    sanitize(req.params.reportname),
    sanitize(req.params.file),
    sanitize(req.params.fragment || "")
  ];

  const filePath = path.join(reportsDir, sanReportName, resultFiles, sanFile, sanFragment);
  res.sendFile(filePath);
});

router.use("/reports/:reportname", express.static(path.dirname(require.resolve("@dodona/dolos-web"))));

