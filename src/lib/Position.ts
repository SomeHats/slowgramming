export default class Position {
  public readonly offset: number;
  public readonly line: number;
  public readonly column: number;

  constructor(offset: number, line: number, column: number) {
    this.offset = offset;
    this.line = line;
    this.column = column;
    Object.freeze(this);
  }
}
