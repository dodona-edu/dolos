import { default as path } from "path";
import File from "./file";

/**
 * Represents a single file or multiple files that form a single unit.
 */
export default class FileGroup {

  /**
   * Create a new FileGroup with a file for each given location.
   */
  public static async asGroup(locations: string[], name?: string): Promise<FileGroup> {
    if (name === undefined) {
      const prefix = findPrefix(locations);
      name = prefix[prefix.length - 1];
    }
    const group = new FileGroup(name);
    await Promise.all(locations.map(l => group.addFile(l)));
    return group;
  }

  /**
   * Create for each location a File and place them in their own FileGroup.
   */
  public static async groupByFile(locations: string[]): Promise<FileGroup[]> {
    return Promise.all(
      locations.map(location =>
        FileGroup.asGroup([location], path.basename(location))),
    );
  }

  /**
   * Create for each location a File and group them per child directory
   * of the lowest common ancestor directory.
   */
  public static async groupByDirectory(fileLocations: string[]): Promise<FileGroup[]> {
    const groups = new Map<string, string[]>();
    const prefixCount = findPrefix(fileLocations).length;

    for (const location of fileLocations) {
      const dir = location.split(path.sep)[prefixCount];
      let group = groups.get(dir);
      if (!group) {
        group = [];
        groups.set(dir, group);
      }
      group.push(location);
    }

    return await Promise.all(
      Array.from(groups.entries())
        .map(([name, locations]) => FileGroup.asGroup(locations, name)),
      );
  }

  public readonly name: string;
  public readonly files: File[];

  private constructor(name: string) {
    this.name = name;
    this.files = [];
  }

  public toString(): string {
    return `FileGroup[${name}]`;
  }

  private async addFile(location: string): Promise<void> {
    this.files.push(await File.read(location, this));
  }

}

/**
 * Finds the directory that is the lowest common ancestor of the given files.
 * I.e. the longest common prefix of directories for each file.
 */
function findPrefix(fileLocations: string[]): string[] {
  return fileLocations.map(location => location.split(path.sep))
    .reduce((prefix, dirs) => {
      let i = 0;
      while (i < prefix.length && prefix[i] === dirs[i]) {
        i++;
      }
      return prefix.slice(0, i);
    });
}
