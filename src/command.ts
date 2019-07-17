import { Comparison } from "./lib/comparison";
import { CodeTokenizer } from "./lib/codeTokenizer";
import commander from 'commander';
let packageJson = require('../package.json');

const program = new commander.Command();

// Initial program description and version
program
    .version(packageJson.version)
    .description('Plagarism detection for programming exercises');

program
    .command('compare <language> <path1> <path2>')
    .alias('c')
    .description('Compare source codes')
    .action(async (language:string, path1:string, path2:string) => {
        // copied from app.ts
        const tokenizer = new CodeTokenizer(language ? language: "javascript");
        const comparison = new Comparison(tokenizer);
        await comparison.addFiles([path1 ? path1: "samples/js/samples.js", path2 ? path2: "samples/js/sample.js"]);
        const result = await comparison.compareFile("samples/js/copied_function.js");
        console.log(result);
    });

/*
using yarn test is better

program
    .command('test')
    .alias('t')
    .description('Test Dolos for accuracy')
    .action( () => {
        // connect to testing functions over here

    });
*/

program.parse(process.argv);