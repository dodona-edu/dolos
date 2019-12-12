import test from "ava";
import { FileGroup } from "../lib/files/fileGroup";

const testLocations: string[] = [
  "samples/js/assignment1/student1/sample.js",
  "samples/js/assignment1/student1/main.js",
  "samples/js/assignment1/student1/subDirectory/childClass.js",
  "samples/js/assignment1/student2/helperClasses/childClass.js",
  "samples/js/assignment1/student2/main.js",
  "samples/js/assignment1/student2/copied_function.js",
  "samples/js/assignment1/student3/tempName/childClass.js",
  "samples/js/assignment1/student3/tempName/hello.js",
  "samples/js/assignment1/student3/tempName/subDir/subsubClass.js",
  "samples/js/assignment1/student3/another_copied_function.js",
  "samples/js/assignment1/student3/main.js",
];

test("group per file", async t => {
  const groups = await FileGroup.groupByFile(testLocations);
  t.is(testLocations.length, groups.length);
  groups.forEach(g => t.is(1, g.files.length));
});

test("group per directory", async t => {
  const groups = await FileGroup.groupByDirectory(testLocations);
  t.is(3, groups.length);

  for (const group of groups) {
    const fileLocations = group.files.map(f => f.location);
    if (group.name === "student1") {
      t.true(
        testLocations.slice(0, 3)
          .every(testLoc => fileLocations.some(loc => loc.endsWith(testLoc)))
      );
    } else if (group.name === "student2") {
      t.true(
        testLocations.slice(3, 6)
          .every(testLoc => fileLocations.some(loc => loc.endsWith(testLoc)))
      );
    } else if (group.name === "student3") {
      t.true(
        testLocations.slice(6)
          .every(testLoc => fileLocations.some(loc => loc.endsWith(testLoc)))
      );
    } else {
      t.fail("groups should have the name of their differentiating directory");
    }
  }
});

test("all in one group", async t => {
  const group = await FileGroup.asGroup(testLocations);
  t.is(testLocations.length, group.files.length);
});
