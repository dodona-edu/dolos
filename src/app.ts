import fs from "fs";
import Parser from "tree-sitter";

const parser = new Parser();
// tslint:disable-next-line: no-var-requires
const language = require("tree-sitter-javascript");
parser.setLanguage(language);

const fileContent = fs.readFileSync("samples/js/sample.js", "utf8");
const tree = parser.parse(fileContent);
console.log(tree.rootNode.toString());
