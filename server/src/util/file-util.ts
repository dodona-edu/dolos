import {default as unzipper} from "unzipper";
import { assert } from "console";
import {default as fsWithCallbacks} from "fs";
import path from "path";
const fs = fsWithCallbacks.promises;



export async function unzip(sourcePath: string, targetPath: string): Promise<void> {
    assert(fsWithCallbacks.existsSync(sourcePath), "Sourcepath does not exist.")
    assert(!fsWithCallbacks.existsSync(targetPath), "Targetpath already exists.")

    const stream = fsWithCallbacks.createReadStream(sourcePath)
        .pipe(unzipper.Extract({ path: targetPath }))

    return new Promise<void>((resolve, reject) => {
        stream.on("close", () => resolve());
        stream.on("error", err => reject(err))
    })
}


export async function collectFilesRecursively(directory: string, values?: string[]): Promise<string[]> {
    assert(fsWithCallbacks.existsSync(directory), "Sourcepath does not exist.")

    if(values === undefined)
        values = [];

    const contents = await fs.readdir(directory);


    for(const content of contents) {
        const absPath = path.join(directory, content);

        const stat = await fs.lstat(absPath);
        if(stat.isDirectory()) {
            await collectFilesRecursively(absPath, values);
        }

        if(stat.isFile()) {
            values.push(absPath);
        }
    }

    return values;
}