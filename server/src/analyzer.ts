import { Dolos } from "@dodona/dolos-lib";
import { FileView } from "@dodona/dolos";

import { default as fsWithCallbacks } from "fs";
import path from "path";
import { resultFiles, unzippedPath } from "./constants";
import { devAssert } from "./util/development-util";
import { anonymizeDirectory, collectFilesRecursively, unzip, fileReadable } from "./util/file-util";


export async function analyze(sourceZipPath: string, anonymize = true, language="javascript"): Promise<void> {
  devAssert(() => fsWithCallbacks.existsSync(sourceZipPath), "This file does not exist.");

  const targetPath = path.join(sourceZipPath, "..", unzippedPath);
  await unzip(sourceZipPath, targetPath);

  const infoCssPath = path.join(targetPath, "info.csv");

  if (await fileReadable(infoCssPath)) {
    if(anonymize)
      await anonymizeDirectory(targetPath);

    await analyzeByDolos(
      [infoCssPath],
      path.join(sourceZipPath, "../..", resultFiles),
      language
    );
  } else {
    const applicableFiles = await collectFilesRecursively(targetPath);
    await analyzeByDolos(
      applicableFiles,
      path.join(sourceZipPath, "../..", resultFiles),
      language
    );
  }
}

async function analyzeByDolos(
  sourcePaths: string[],
  targetPath: string,
  language: string
): Promise<void> {
  const dolos = new Dolos({ language });
  const report = await dolos.analyzePaths(sourcePaths);
  const files = new FileView(report, { outputDestination: targetPath });
  files.writeToDirectory();
}
