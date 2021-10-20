import { randomUUID } from "crypto";
import { default as fsWithCallbacks } from "fs";
import path from "path";
import { default as unzipper } from "unzipper";
import { devAssert } from "./development-util";
const fs = fsWithCallbacks.promises;



export async function unzip(sourcePath: string, targetPath: string): Promise<void> {
  devAssert(() => fsWithCallbacks.existsSync(sourcePath), "Sourcepath does not exist.");
  devAssert(() => !fsWithCallbacks.existsSync(targetPath), "Targetpath already exists.");

  const stream = fsWithCallbacks.createReadStream(sourcePath)
    .pipe(unzipper.Extract({ path: targetPath }));

  return new Promise<void>((resolve, reject) => {
    stream.on("close", () => resolve());
    stream.on("error", err => reject(err));
  });
}

export async function anonimizeDirectory(folder: string): Promise<void> {
  devAssert(() => fsWithCallbacks.existsSync(folder), "Sourcepath does not exist.");

  const idMap = new Map();

  const contents = await fs.readdir(folder);
  for (const content of contents) {
    const absPath = path.join(folder, content);

    if(!idMap.has(content))
      idMap.set(content, randomUUID());

    await fs.rename(absPath, path.join(folder, idMap.get(content)));
  }
}


export async function collectFilesRecursively(directory: string, values?: string[]): Promise<string[]> {
  devAssert(() => fsWithCallbacks.existsSync(directory), "Sourcepath does not exist.");

  const currentValues = values || [];
  const contents = await fs.readdir(directory);


  for (const content of contents) {
    const absPath = path.join(directory, content);

    const stat = await fs.lstat(absPath);
    if (stat.isDirectory()) {
      await collectFilesRecursively(absPath, currentValues);
    }

    if (stat.isFile()) {
      currentValues.push(absPath);
    }
  }

  return currentValues;
}
