import commander from "commander";
import { Matches } from "./lib/comparison.js";
// import fs from "fs";

import path from "path";
import { CodeTokenizer } from "./lib/codeTokenizer";
import { Comparison } from "./lib/comparison";
import { Summary } from "./lib/summary.js";
import { SummaryFilter } from "./lib/summaryFilter.js";
// import { Visualize } from "./lib/visualize";
// import { stringLiteral } from "@babel/types";

const packageJson = require("../package.json");

const program = new commander.Command();

// Initial program description and version
program.version(packageJson.version).description("Plagiarism detection for programming exercises");

let locations: string[] = [];

program //TODO ask about if the indentation is ok
  .option("-l, --language <language>", "Language used in the compared programs.", "javascript")
  .option("-d, --directory", "Specifies that submission are per directory, not by file.")
  .option(
    "-b, --base <base>",
    "this option specifies a base file, any code that also appears in the base file is not shown. A typical base " +
    "file is the supplied code for an exercise. If used in combination with with the -d option then the location " + 
    "supplied should be the location of the directory and the actual files should then be supplied with the rest of " + 
    "the files. For example: dolos -d -b exercises/assignment1-basefile/ exercises/assignment1-basefile/*.js " +
    "student-solutions/*/*.js:w",
  )
  .option(
    "-m, --maximum <number>",
    "The -m options sets the maximum number of time a given passage may appear before it is ignored. A passage of " + 
    "code that appears in many programs is probably legitimate sharing and not the result of plagiarism. With -m N " +
    "any passage appearing in more that N program is filtered out. Using this option will overwrite the -M option." 
  )
  .option(
    "-M --maximum-percentage <float>",
    "maximum percentage a passage may appear before it is ignored. The percentage is calculated using the amount of " +
    "different groups there are. So with the -d options the amount of directories is used where normally the " +
    "amount of files is used. Must be a value between 1 and 0.", 0.9 
  )
  .option("-c, --comment <string>", "comment string that is attached to the generated report")
  .option("-n, --file-amount", "The -n option specifies how many matching file are shown in the result")
  .option(
    "-s, --minimum-lines <integer>",
    "the minimum amount of lines in the longest range in a rangesTuple before it is shown",
    2,
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    "the maximum allowed amount of lines between two ranges that are not part of the ranges them selves",
    0,
  )
  .option(
    "-z, --zero-based-lines",
    "specifies whether or not you want lines to be zero based",
    false,
  )
  .arguments("<locations...>")
  .action(filesArgs => {
    locations = filesArgs;
  });

// TODO examples and formatting
program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log(
    "  $ dolos -l javascript *.js",
    "gives dolos all the files in the current directory and tells that tells dolos that they are in javascript",
  );
  console.log("  $ dolos *.js -g 0");
  console.log("  [[[0, 2], [9, 11]], [[4, 5], [13, 14]]]");
  console.log("  $ dolos *.js -g 1");
  console.log("  [[[0, 5], [9, 14]]]");
});

program.parse(process.argv);
/**
 * This function allows one to merge two maps into one. 
 * @param matchesPerFile A map containing the matches. This map will be modified in place.
 * @param newMatches The map you want to merge into the first map.
 */
function compose(matchesPerFile: Map<string, Matches<number>>, newMatches: Map<string, Matches<number>>) {
  newMatches.forEach((matches, matchedFileName) => {
    matches.forEach((matchLocations, matchingFile) => {
      let map: Matches<number> | undefined = matchesPerFile.get(matchingFile);
      if (map === undefined) {
        map = new Map();
        matchesPerFile.set(matchedFileName, map);
      }
      map.set(matchingFile, matchLocations);
    });
  });
}

/**
 * Groups files per directory. 
 * @param locations The locations you want to group.
 * @returns An array where each subArray contains files that are in the same directory.
 */
function groupPerDirectory(locations: string[]): Array<Array<string>> {

    const locationsFragments = locations.map(filePath => filePath.split(path.sep));
    const filesGroupedPerDirectoryMap: Map<string, string[]> = new Map();

    let baseDirIndex = 0;
    let baseDir = locationsFragments[0][0];
    while (
      locationsFragments.every(filePathFragments => filePathFragments[baseDirIndex] === baseDir)
    ) {
      baseDirIndex += 1;
      baseDir = locationsFragments[0][baseDirIndex];
    }

    locationsFragments.forEach(filePathFragments => {
      let groupedFiles: string[] | undefined = filesGroupedPerDirectoryMap.get(
        filePathFragments[baseDirIndex],
      );
      if (groupedFiles === undefined) {
        groupedFiles = new Array();
        filesGroupedPerDirectoryMap.set(filePathFragments[baseDirIndex], groupedFiles);
      }
      groupedFiles.push(path.join(...filePathFragments));
    });

    return [...filesGroupedPerDirectoryMap.values()];
}

(async () => {

  let baseFiles: string[] | undefined;
  let groupAmount: number;
  const tokenizer = new CodeTokenizer(program.language);
  const results: Map<string, Matches<number>> = new Map();
  let baseFileMatches: Map<string, Matches<number>> = new Map();

  // if the -d and the -b flag are active, filter out all the basefile locations
  if (program.directory && program.base) {
    program.base = path.normalize(program.base);

    baseFiles = locations.filter(filePath => filePath.startsWith(program.base));
    locations = locations.filter(filePath => !filePath.startsWith(program.base));
  }

  if (locations.length < 2) {
    console.error("need at least two locations");
    process.exit(1);
  }


  if (program.directory) {


    if (program.base && baseFiles === undefined) {
      console.error("no valid base files given");
      process.exit(2);
    }

    const filesGroupPerDirectory: string[][] = groupPerDirectory(locations);

    // If each program is a directory, then count the amount of directories.
    groupAmount = filesGroupPerDirectory.length;
    
    // If there is a base directory, compare all directories with it and put the results in one map.
    if (program.base) {
      for(let i = 0; i < filesGroupPerDirectory.length; i += 1){
        const baseFileComparison = new Comparison(tokenizer);
        await baseFileComparison.addFiles(baseFiles as string[]);
        compose(baseFileMatches, await baseFileComparison.compareFiles(filesGroupPerDirectory[i]));
      }
    }

    // Compare all directories with each other.
    for (let i = 0; i < filesGroupPerDirectory.length; i += 1) {
      for (let j = i + 1; j < filesGroupPerDirectory.length; j += 1) {
        const comparison = new Comparison(tokenizer);
        await comparison.addFiles(filesGroupPerDirectory[i]);
        const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(
          filesGroupPerDirectory[j],
        );
        compose(
          results,
          matchesPerFile,
        );

      }
    }
  } else {
    // If each file is a separate program then count the amount of files.
    groupAmount = locations.length;

    // Compare the base file with all the other files when there is a base file.
    if (program.base) {
      const baseFileComparison = new Comparison(tokenizer);
      await baseFileComparison.addFile(program.base);
      baseFileMatches = await baseFileComparison.compareFiles(locations);
    }

    // Compare all the file with each other.
    while (locations.length > 1) {
      const location: string = locations.shift() as string;
      const comparison = new Comparison(tokenizer);
      await comparison.addFile(location);
      const matchesPerFile: Map<string, Matches<number>> = await comparison.compareFiles(locations);

      compose(
        results,
        matchesPerFile,
      );
    }
  }

  const summaryFilter: SummaryFilter = new SummaryFilter(
    0,
    program.minimumLines,
    program.maximum || program.maximumPercentage,
    baseFileMatches,
    program.maximum === undefined ? program.maximumPercentage : undefined
  );
  const summary = new Summary(results,summaryFilter, program.MaximumGapSize, program.comment, program.fileAmount);
  console.log(summary.toString(program.zeroBasedLines));
})();
