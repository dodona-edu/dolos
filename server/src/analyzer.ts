import { Dolos, FileView } from "@dodona/dolos/dist/dolos";
import { assert } from "console";
import {default as fsWithCallbacks} from "fs";
const fs = fsWithCallbacks.promises;
import path from "path";
import {default as unzipper} from "unzipper";

const unzippedPath = "unzipped"
const resultFiles = "results";

export async function analyze(sourceZipPath: string) {
    assert(fsWithCallbacks.existsSync(sourceZipPath), "This file does not exist.");

    const targetPath = path.join(sourceZipPath, "..", unzippedPath);
    await unzip(sourceZipPath, targetPath);

    const applicableFiles = await collectFiles(targetPath)
    console.log("files: ", applicableFiles)
    await analyzeByDolos(applicableFiles, path.join(sourceZipPath, "../..", resultFiles));
}

async function unzip(sourcePath: string, targetPath: string): Promise<void> {
    assert(fsWithCallbacks.existsSync(sourcePath), "Sourcepath does not exist.")
    assert(!fsWithCallbacks.existsSync(targetPath), "Targetpath already exists.")

    const stream = fsWithCallbacks.createReadStream(sourcePath)
        .pipe(unzipper.Extract({ path: targetPath }))

    return new Promise<void>((resolve, reject) => {
        stream.on("close", () => resolve());
        stream.on("error", err => reject(err))
    })
}

async function collectFiles(directory: string, values?: string[]): Promise<string[]> {
    assert(fsWithCallbacks.existsSync(directory), "Sourcepath does not exist.")

    if(values === undefined)
        values = [];

    const contents = await fs.readdir(directory);


    for(const content of contents) {
        const absPath = path.join(directory, content);

        const stat = await fs.lstat(absPath);
        if(stat.isDirectory()) {
            await collectFiles(absPath, values);
        }

        if(stat.isFile()) {
            values.push(absPath);
        }
    }

    return values;
}

async function analyzeByDolos(sourcePaths: string[], targetPath: string) {
    console.log("analyzin")
    const dolos = new Dolos();
    const report = await dolos.analyzePaths(sourcePaths);
    console.log("analyzed")
    const files = new FileView(report, {outputDestination: targetPath});
    files.writeToDirectory();
}