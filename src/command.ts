const commander = require('commander');
const fs = require('fs');

import { Comparison } from "./lib/comparison";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Visualize } from "./lib/visualize";
// import { stringLiteral } from "@babel/types";

let packageJson = require('../package.json');

const program = new commander.Command();

// Initial program description and version
program
    .version(packageJson.version)
    .description('Plagarism detection for programming exercises');

program
    .command('compare') // [language] [path1] [path2]')
    .alias('c')
    .option('-l, --language <language>', 'language used in the compared programs')
    .option('-s, --source <source> [compared]', 'source file used to compare against other files')
    .option('-d, --directory <directory>', 'source file will be compared to all files from directory')
    .option('-b, --base <base>', 'base file that is not counted in matches')
    .option('-m, --maximum <number>', 'maximum number of times a given passage may appear before it is ignored')
    .option('-c, --comment <string>', 'comment string that is attached to the generated report')
    // .option('')
    .description('Compare source codes')
    .action(async (options:any, language?:string, path1?:string, path2?:string):Promise<void> => { // , language?:string, path1?:string, path2?:string
        // from app.ts
        let sourceFile:string;
        console.log("Entering compare");
        console.log(`Variables language, path1, and path2 are: ${language}, ${path1}, ${path2}`);
        sourceFile = options.source; // filler to make compiler work for now
        if (options.language) {
            console.log(`The language is ${options.language}`);
            language = options.language;
        }
        if (options.source) {
            // required, will figure out how to get there
            sourceFile = options.source;
        }
        if (options.base) {
            // TODO: functionality for base code that wouldn't be recognized by program
            console.log(`We are in base! base is ${options.base}`);
        }
        if (options.maximum) {
            // TODO: add in maximum number of times a message is allowed to appear
        }
        if (options.comment) {
            // add in comment string that is attached to report
            // for now, we just comment this on our results
            console.log(`COMMENT: ${options.comment}`);
        }
        if (options.directory) {
            // find all files in directory, and compare them against source file
            console.log(`directory name: ${options.directory}`);
            const tokenizer = new CodeTokenizer(language ? language: "javascript");
            const comparison = new Comparison(tokenizer);
            let files = fs.readdirSync(options.directory);
            let dirHasSlash: boolean = options.directory.substr(options.directory.length - 1) === "/";
            console.log(`dirHasSlash: ${dirHasSlash}`);
            for (let i = 0; i< files.length; ++i) {
                // add the folder name to our files, so that it is findable
                let file = files[i];
                let addFolderName;
                if (dirHasSlash) {
                    addFolderName = options.directory + file;
                }
                else {
                    addFolderName = options.directory + "/" + file;
                }
                files[i] = addFolderName;
            }

            await comparison.addFiles(files);
            const result = await comparison.compareFile(sourceFile? sourceFile: "samples/js/copied_function.js");
            console.log(result);
        }
        else if (!options.directory) {
            // comparing one file against only one other file
            const tokenizer = new CodeTokenizer(language ? language: "javascript");
            const comparison = new Comparison(tokenizer);
            await comparison.addFile(path1 ? path1: "samples/js/sample.js");
            const result = await comparison.compareFile(sourceFile? options.source: "samples/js/copied_function.js");
            console.log(result);
        }

        const visualizer = new Visualize(sourceFile? options.source: "samples/js/copied_function.js");
        visualizer.getSourceFile()

    });

program.parse(process.argv);