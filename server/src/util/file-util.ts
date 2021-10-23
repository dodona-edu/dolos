import csv from "async-csv";
import { default as fsWithCallbacks } from "fs";
import path from "path";
import {
  adjectives,
  colors,
  names,
  uniqueNamesGenerator
} from "unique-names-generator";
import { default as unzipper } from "unzipper";
import { devAssert } from "./development-util";

const fs = fsWithCallbacks.promises;

export async function unzip(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  devAssert(
    () => fsWithCallbacks.existsSync(sourcePath),
    "Sourcepath does not exist."
  );
  devAssert(
    () => !fsWithCallbacks.existsSync(targetPath),
    "Targetpath already exists."
  );

  const stream = fsWithCallbacks
    .createReadStream(sourcePath)
    .pipe(unzipper.Extract({ path: targetPath }));

  return new Promise<void>((resolve, reject) => {
    stream.on("close", () => resolve());
    stream.on("error", err => reject(err));
  });
}

export async function collectFilesRecursively(
  directory: string,
  values?: string[]
): Promise<string[]> {
  devAssert(
    () => fsWithCallbacks.existsSync(directory),
    "Sourcepath does not exist."
  );

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

export async function anonymizeDirectory(folder: string): Promise<void> {
  devAssert(
    () => fsWithCallbacks.existsSync(folder),
    "Sourcepath does not exist."
  );
  devAssert(
    () => fsWithCallbacks.existsSync(path.join(folder, "info.csv")),
    "Source CSV does not exist."
  );

  const idMap = new Map();
  const usedNames = new Set();

  const contents = await fs.readdir(folder);
  for (const content of contents) {
    const absPath = path.join(folder, content);
    const stat = await fs.stat(absPath);

    if (stat.isDirectory()) {
      if (!idMap.has(content)) {
        let name = generateName();
        while (name in usedNames)
          name = generateName();

        idMap.set(content, name);
        usedNames.add(name);
      }

      await fs.rename(absPath, path.join(folder, idMap.get(content)));
    }
  }

  await anonymizeCsv(folder, idMap);
}

async function anonymizeCsv(
  folder: string,
  idMap: Map<string, string>
): Promise<void> {
  const file = await fs.readFile(path.join(folder, "info.csv"), "utf-8");
  console.log(csv);
  const csvData = (await csv.parse(file)) as string[][];
  const anonymizedData = [];

  for (const row of csvData) {
    const id = row[0].match(/^[^/]*/);

    if (id && id.length > 0 && idMap.get(id[0])) {
      const replacementName = idMap.get(id[0]);
      if (replacementName) {
        const newFilename = row[0].replace(/^[^/]*/, replacementName);

        const newRow = [newFilename, "", "", "", "", "", "", ...row.slice(7)];
        anonymizedData.push(newRow);
      }
    } else {
      anonymizedData.push(row);
    }
  }

  const newCsvData = await csv.stringify(anonymizedData);
  await fs.writeFile(path.join(folder, "info.csv"), newCsvData);
}


function generateName() {
  return uniqueNamesGenerator({
    separator: "-",
    dictionaries: [adjectives, colors, names],
    length: 2
  });
}
