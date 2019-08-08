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
    .arguments('[...files]')
    .option('-l, --language <language>', 'language used in the compared programs', 'javascript')
    .option('-d, --directory <directory>', 'specifies that submission are per directory, not by file')
    .option('-b, --base <base>', 'this option specifies a base file, any code that also appears in the base file is not shown. A typical base file is the supplied code for an exercise')
    .option('-m, --maximum <number>', 'maximum number of times a given passage may appear before it is ignored', 10)
    .option('-c, --comment <string>', 'comment string that is attached to the generated report')
    .option('-n, --minimum-lines', 'the minimum amount of lines in a range before it is shown', 2)
    .option('-g, --maximum-gap-size', 'the maximum allowed amount of lines between two ranges that are not part of the ranges them selves', 0)

//TODO examples
program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ dolos -l javascript *.js', 'gives dolos all the files in the current directory and tells that tells dolos that they are in javascript');
    console.log('  $ dolos *.js -g 0');
    console.log('  [[[0, 2], [9, 11]], [[4, 5], [13, 14]]]')
    console.log('  $ dolos *.js -g 1');
    console.log('  [[[0, 5], [9, 14]]]');
});

program.parse(process.argv);


(async () => {
    let result: Map<string, Matches<number>>;

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
        result = await comparison.compareFile(program.sourceFile);
    }
    else if (!program.directory) {
        // comparing one file against only one other file
        const tokenizer = new CodeTokenizer(program.language);
        const comparison = new Comparison(tokenizer);
        await comparison.addFile(""); //TODO change this
        result = await comparison.compareFile(program.sourceFile);
        if (result) console.log('got a result'); //TODO remove this
    }

})();
        // const visualizer = new Visualize(sourceFile? sourceFile: "samples/js/copied_function.js"); // , sourceFile?
        // sourceFile: "samples/js/copied_function.js", result visualizer.getSourceFile()

