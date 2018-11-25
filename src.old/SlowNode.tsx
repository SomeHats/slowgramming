import * as ESTree from 'estree';
import * as esprima from 'esprima';

class SlowNode<T extends ESTree.Node> {
  public readonly astNode: T;
  public readonly tokens: Array<esprima.Token> = [];

  constructor(astNode: T) {
    this.astNode = astNode;
  }

  addToken(token: esprima.Token) {
    this.tokens.push(token);
  }
}

export default SlowNode;
