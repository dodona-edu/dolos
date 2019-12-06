import { default as path } from "path";
import File from "./file";

/**
 * Represents a single file or multiple files that form a single unit.
 */
export default class FileGroup {

  /**
   * Create a new FileGroup with a file for each given location.
   */
  public static asGroup(locations: string[], name?: string): FileGroup {
    const files = locations.map(l => new File(l));
    if (name === undefined) {
      const prefix = findPrefix(files);
      name = prefix[prefix.length - 1];
    }
    return new FileGroup(name, files);
  }

  /**
   * Create for each location a File and place them in their own FileGroup.
   */
  public static groupByFile(locations: string[]): FileGroup[] {
    return locations.map(location =>
      new FileGroup(path.basename(location), [new File(location)]));
  }

  /**
   * Create for each location a File and group them per child directory
   * of the lowest common ancestor directory.
   */
  public static groupByDirectory(fileLocations: string[]): FileGroup[] {
    const files = fileLocations.map(l => new File(l));
    const groups = new Map<string, File[]>();
    const prefixCount = findPrefix(files).length;

    for (const file of files) {
      const dir = file.location.split(path.sep)[prefixCount];
      let group = groups.get(dir);
      if (!group) {
        group = [];
        groups.set(dir, group);
      }
      group.push(file);
    }

    return Array.from(groups.entries()).map(([n, f]) => new FileGroup(n, f));
  }

  public readonly name: string;
  public readonly files: File[];

  private constructor(name: string, files: File[]) {
    this.name = name;
    this.files = files;
  }

}

/**
 * Finds the directory that is the lowest common ancestor of the given files.
 * I.e. the longest common prefix of directories for each file.
 */
export function findPrefix(files: File[]): string[] {
  return files.map(f => f.location.split(path.sep))
    .reduce((prefix, dirs) => {
      let i = 0;
      while (i < prefix.length && prefix[i] === dirs[i]) {
        i++;
      }
      return prefix.slice(0, i);
    });
}
