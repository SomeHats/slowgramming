import assert from 'assert';
// import React from 'react';
// import * as ReactDOM from 'react-dom';
// import Slowgramming from './Slowgramming';
import * as esprima from 'esprima';
import * as ESTree from 'estree';
import { assertExists } from './util';
import SlowNode from './SlowNode';

const code = `
2 + 2;
1 + 2 + 3 + 4 + 5;
'hello' + 'world' + 4 + 8;
1 + 2 + 'woo'
'number' + 123;
`.trim();

const ast = esprima.parseModule(code, {
  range: true,
  tokens: true,
});

const tokens = assertExists(ast.tokens);
console.log(tokens);

const getStartIdx = (node: ESTree.Node | esprima.Token): number =>
  assertExists((node as any).range)[0];

const getEndIdx = (node: ESTree.Node | esprima.Token): number =>
  assertExists((node as any).range)[1];

class NodeTracker {
  private astToSlowNodeMap: WeakMap<
    ESTree.Node,
    SlowNode<ESTree.Node>
  > = new WeakMap();
  private tokenToSlowNodeMap: WeakMap<
    esprima.Token,
    SlowNode<ESTree.Node>
  > = new WeakMap();
  public readonly astRoot: ESTree.Node;
  public readonly tokens: Array<esprima.Token>;
  public readonly lines: Array<Array<esprima.Token>> = [];

  constructor(astRoot: ESTree.Node, tokens: Array<esprima.Token>) {
    this.astRoot = astRoot;
    this.tokens = tokens;
  }

  getSlowNode<T extends ESTree.Node>(node: T): SlowNode<T> {
    const existingSlowNode = this.astToSlowNodeMap.get(node);
    if (!existingSlowNode) {
      const newSlowNode = new SlowNode(node);
      this.astToSlowNodeMap.set(node, newSlowNode);
      return newSlowNode;
    }

    if (existingSlowNode.astNode.type === node.type) {
      return existingSlowNode as any;
    }

    throw new Error('Node types do not match');
  }

  addTokenToNode(node: ESTree.Node, token: esprima.Token) {
    if (this.tokenToSlowNodeMap.has(token)) {
      throw new Error('Token already in use');
    }

    console.log('addTokenToNode', node.type, token);
    const slowNode = this.getSlowNode(node);
    this.tokenToSlowNodeMap.set(token, slowNode);
    slowNode.addToken(token);
  }

  tokensInRange(startIdx: number, endIdx: number): Array<esprima.Token> {
    return this.tokens.filter(token => {
      const tokenStartIdx = getStartIdx(token);
      const tokenEndIdx = getEndIdx(token);
      const startInRange = startIdx <= tokenStartIdx && tokenStartIdx <= endIdx;
      const endInRange = startIdx <= tokenEndIdx && tokenEndIdx <= endIdx;
      return startInRange && endInRange;
    });
  }
}

const doThing = (node: ESTree.Node, tracker: NodeTracker) => {
  switch (node.type) {
    case 'Program': {
      for (const statement of node.body) {
        doThing(statement, tracker);
      }
      return;
    }

    case 'ExpressionStatement': {
      doThing(node.expression, tracker);

      const endOfExpression = getEndIdx(node.expression);
      const endOfStatement = getEndIdx(node);
      const semiColon = tracker.tokensInRange(endOfExpression, endOfStatement);
      if (semiColon.length) {
        assert.equal(semiColon.length, 1);
        assert.equal(semiColon[0].value, ';');
        tracker.addTokenToNode(node, semiColon[0]);
      }
      return;
    }

    case 'BinaryExpression': {
      doThing(node.left, tracker);
      const operators = tracker.tokensInRange(
        getEndIdx(node.left),
        getStartIdx(node.right),
      );
      assert.equal(operators.length, 1);
      tracker.addTokenToNode(node, operators[0]);
      doThing(node.right, tracker);
      return;
    }

    case 'Literal': {
      const tokens = tracker.tokensInRange(getStartIdx(node), getEndIdx(node));
      assert.equal(tokens.length, 1);
      tracker.addTokenToNode(node, tokens[0]);
      return;
    }

    default:
      // TODO: exhaustive checking
      throw new Error(`Unknown node type ${node.type}`);
  }
};

const tracker = new NodeTracker(ast, tokens);
doThing(ast, tracker);

// ReactDOM.render(<Slowgramming code={code} />, document.getElementById('root'));
