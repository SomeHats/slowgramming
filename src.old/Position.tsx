import * as ESTree from 'estree';
import { assertExists } from './util';

export default class Position {
  static fromNodeStart(node: ESTree.Node, source: string): Position {
    return new Position(assertExists(node.range)[0], source);
  }

  static fromNodeEnd(node: ESTree.Node, source: string): Position {
    return new Position(assertExists(node.range)[1], source);
  }

  public readonly line: number;
  public readonly column: number;
  public readonly offset: number;
  public readonly source: string;

  constructor(offset: number, source: string) {
    this.offset = offset;
    this.source = source;

    let line = 0;
    let column = 0;

    for (let i = 0; i < offset; i++) {
      if (source[i] === '\n') {
        line += 1;
        column = 0;
      } else {
        column += 1;
      }
    }

    this.line = line;
    this.column = column;
  }

  addOffset(offset: number): Position {
    return new Position(this.offset + offset, this.source);
  }
}
