import { Comparison } from "../comparison";
test("grouping files test", () => {
  const files: string[] = [
    "samples/js/assignment1/student3/tempName/childClass.js",
    "samples/js/assignment1/student3/tempName/hello.js",
    "samples/js/assignment1/student3/tempName/subDir/subsubClass.js",
    "samples/js/assignment1/student3/another_copied_function.js",
    "samples/js/assignment1/student3/main.js",
    "samples/js/assignment1/student2/helperClasses/childClass.js",
    "samples/js/assignment1/student2/main.js",
    "samples/js/assignment1/student2/copied_function.js",
    "samples/js/assignment1/student1/sample.js",
    "samples/js/assignment1/student1/main.js",
    "samples/js/assignment1/student1/subDirectory/childClass.js",
  ];

  const groupedFiles: Map<string, string> = Comparison.groupPerDirectory(files);
  expect(groupedFiles.size).toBe(files.length);

  for (const [fileName, groupRoot] of groupedFiles.entries()) {
    expect(fileName.includes(groupRoot)).toBe(true);
  }
});
