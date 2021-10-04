import { Dolos, FileView } from "@dodona/dolos/dist/dolos";
import { assert } from "console";
import { default as fsWithCallbacks } from "fs";
import path from "path";
import { resultFiles, unzippedPath } from "./constants";
import { collectFilesRecursively, unzip } from "./util/file-util";


export async function analyze(sourceZipPath: string): Promise<void> {
  assert(fsWithCallbacks.existsSync(sourceZipPath), "This file does not exist.");

  const targetPath = path.join(sourceZipPath, "..", unzippedPath);
  await unzip(sourceZipPath, targetPath);

  const applicableFiles = await collectFilesRecursively(targetPath);
  console.log("files: ", applicableFiles);
  await analyzeByDolos(applicableFiles, path.join(sourceZipPath, "../..", resultFiles));
}



async function analyzeByDolos(sourcePaths: string[], targetPath: string): Promise<void> {
  const dolos = new Dolos();
  const report = await dolos.analyzePaths(sourcePaths);
  const files = new FileView(report, { outputDestination: targetPath });
  files.writeToDirectory();
}