const commander = require('commander');
const fs = require('fs');

import { Comparison } from "./lib/comparison";
import { CodeTokenizer } from "./lib/codeTokenizer";
// import { Visualize } from "./lib/visualize";
// import { stringLiteral } from "@babel/types";

let packageJson = require('../package.json');

const program = new commander.Command();

// Initial program description and version
program
    .version(packageJson.version)
    .description('Plagarism detection for programming exercises');

//TODO better descriptions and remove odd flags
program
    .option('-l, --language <language>', 'language used in the compared programs', 'javascript')
    .option('-s, --source <source> [compared]', 'source file used to compare against other files')
    .option('-d, --directory <directory>', 'source file will be compared to all files from directory')
    .option('-b, --base <base>', 'base file that is not counted in matches')
    .option('-m, --maximum <number>', 'maximum number of times a given passage may appear before it is ignored')
    .option('-c, --comment <string>', 'comment string that is attached to the generated report')


program.parse(process.argv);


(async () => {

    // from app.ts
    let sourceFile:string;
    let result: any;
    // console.log(`Variables language, path1, and path2 are: ${language}, ${path1}, ${path2}`);
    sourceFile = program.source; // filler to make compiler work for now
    if (program.language) {
        console.log(`The language is ${program.language}`);
    }
    if (program.source) {
        // required, will figure out how to get there
        console.log(program.source);
    }
    if (program.base) {
        // TODO: functionality for base code that wouldn't be recognized by program
        console.log(`We are in base! base is ${program.base}`);
    }
    if (program.maximum) {
        // TODO: add in maximum number of times a message is allowed to appear
    }
    if (program.comment) {
        // add in comment string that is attached to report
        // for now, we just comment this on our results
        console.log(`COMMENT: ${program.comment}`);
    }
    if (program.directory) {
        // find all files in directory, and compare them against source file
        console.log(`directory name: ${program.directory}`);
        const tokenizer = new CodeTokenizer(program.language);
        const comparison = new Comparison(tokenizer);
        let files = fs.readdirSync(program.directory);
        let dirHasSlash: boolean = program.directory.substr(program.directory.length - 1) === "/";
        console.log(`dirHasSlash: ${dirHasSlash}`);
        for (let i = 0; i< files.length; ++i) {
            // add the folder name to our files, so that it is findable
            let file = files[i];
            let addFolderName;
            if (dirHasSlash) {
                addFolderName = program.directory + file;
            }
            else {
                addFolderName = program.directory + "/" + file;
            }
            files[i] = addFolderName;
        }

        await comparison.addFiles(files);
        result = await comparison.compareFile(sourceFile? sourceFile: "samples/js/copied_function.js");
        //console.log(result);
    }
    else if (!program.directory) {
        // comparing one file against only one other file
        const tokenizer = new CodeTokenizer(program.language);
        const comparison = new Comparison(tokenizer);
        await comparison.addFile(""); //TODO change this
        result = await comparison.compareFile(sourceFile? sourceFile: "samples/js/copied_function.js");
        if (result) console.log('got a result'); //TODO remove this
    }

})();
        // const visualizer = new Visualize(sourceFile? sourceFile: "samples/js/copied_function.js"); // , sourceFile? sourceFile: "samples/js/copied_function.js", result
        // visualizer.getSourceFile()

