const commander = require('commander');

import { Comparison } from "./lib/comparison";
import { CodeTokenizer } from "./lib/codeTokenizer";

let packageJson = require('../package.json');

const program = new commander.Command();

// Initial program description and version
program
    .version(packageJson.version)
    .description('Plagarism detection for programming exercises');

program
    .command('compare [language] [path1] [path2]')
    .alias('c')
    .description('Compare source codes')
    .action(async (language:string, path1:string, path2:string):Promise<void> => {
        // from app.ts
        console.log("Entering compare");
        const tokenizer = new CodeTokenizer(language ? language: "javascript");
        const comparison = new Comparison(tokenizer);
        await comparison.addFiles([path1 ? path1: "samples/js/samples.js", path2 ? path2: "samples/js/sample.js"]);
        const result = await comparison.compareFile("samples/js/copied_function.js");
        console.log(result);
    });

program.parse(process.argv);