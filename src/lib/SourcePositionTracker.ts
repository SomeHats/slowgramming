import assert from 'assert';
import Position from './Position';
import * as StringModifications from './StringModifications';

export default class SourcePositionTracker {
  private transformedSource: string;
  private readonly offsetByPosition: Array<Array<number>> = [[]];
  private readonly positionByOffset: Array<Position> = [];
  private readonly modifications: Array<StringModifications.Modification> = [];

  constructor(source: string) {
    this.transformedSource = source;

    let line = 0;
    let column = 0;
    for (let offset = 0; offset <= source.length; offset++) {
      const position = new Position(offset, line, column);
      this.offsetByPosition[line][column] = offset;
      this.positionByOffset[offset] = position;

      if (source[offset] === '\n') {
        line += 1;
        column = 0;
        this.offsetByPosition[line] = [];
      } else {
        column += 1;
      }
    }
  }

  public get originalLength(): number {
    return this.positionByOffset.length;
  }

  public fromOriginalOffset(offset: number): Position {
    assert(offset >= 0, 'offset must be positive');
    assert(
      offset < this.originalLength,
      `offset (${offset}) must be less than source length (${this.originalLength})`,
    );

    return this.applyModifications(this.positionByOffset[offset]);
  }

  public fromModifiedOffset(offset: number): Position {
    let line = 0;
    let column = 0;
    for (let i = 0; i < offset; i++) {
      if (this.transformedSource[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }
    return new Position(offset, line, column);
  }

  public insert(startOffset: number, inserted: string) {
    const startPosition = this.fromModifiedOffset(startOffset);
    this.modifications.push(StringModifications.insert(startPosition, inserted));

    this.transformedSource = [
      this.transformedSource.slice(0, startOffset),
      inserted,
      this.transformedSource.slice(startOffset),
    ].join('');
  }

  public remove(startOffset: number, endOffset: number) {
    const startPosition = this.fromModifiedOffset(startOffset);
    const endPosition = this.fromModifiedOffset(endOffset);

    const removed = this.transformedSource.slice(startOffset, endOffset);

    this.modifications.push(StringModifications.remove(startPosition, endPosition, removed));

    this.transformedSource = [
      this.transformedSource.slice(0, startOffset),
      this.transformedSource.slice(endOffset),
    ].join('');
  }

  private applyModifications(position: Position): Position {
    return this.modifications.reduce(
      (transformedPosition, modification) =>
        StringModifications.applyModification(transformedPosition, modification),
      position,
    );
  }
}
