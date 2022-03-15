
export default abstract class Identifiable {

  private static nextId = 0;

  public readonly id: number;

  protected constructor(id?: number) {
    if(id !== undefined)
      this.id = id;
    else
      this.id = Identifiable.nextId++;
  }
}