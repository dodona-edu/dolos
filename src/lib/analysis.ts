import { Intersection } from "./intersection";
import { DefaultMap } from "./defaultMap";
import { File } from "./file";
import { Match } from "./match";
import { Selection } from "./selection";

export class Analysis {


  // to keep track of which two files match (and not have two times the same
  // Intersection but in different order), we use a nested map where we use
  // the two keys in lexicographical order
  private intersectionMap: DefaultMap<File, Map<File, Intersection>> =
      new DefaultMap(() => new Map())

  public addMatch(left: File, right: File, match: Match<Selection>): void {
    const [first, second] = [left, right].sort(File.compare);
    let intersection = this.intersectionMap.get(first).get(second);
    if (!intersection) {
      intersection = new Intersection(left, right);
      this.intersectionMap.get(first).set(second, intersection);
    }

    intersection.addMatch(match);
  }

  public *intersectionIterator(): IterableIterator<Intersection> {
    for (const map of this.intersectionMap.values()) {
      yield *map.values();
    }
  }

  public intersections(): Array<Intersection> {
    return Array.of(...this.intersectionIterator());
  }

}
