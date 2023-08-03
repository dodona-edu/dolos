

export abstract class Identifiable {

  private static nextId = 0;

  public readonly id: number;

  protected constructor(id?: number) {
    if(id !== undefined) {
      this.id = id;
      Identifiable.nextId = Math.max(Identifiable.nextId, id+1);
    }
    else
      this.id = Identifiable.nextId++;
  }
}
