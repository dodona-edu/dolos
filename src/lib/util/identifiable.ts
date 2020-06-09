
export default abstract class Identifiable {

  private static nextId = 0;

  public readonly id: number;

  protected constructor() {
    this.id = Identifiable.nextId++;
  }
}