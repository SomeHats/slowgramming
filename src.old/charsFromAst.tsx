import * as ESTree from 'estree';
import { crash, assertExists, spawnUnknownSwitchCaseError } from './util';
import { SourceChar } from './types';
import Position from './Position';

const charsFromAst = (node: ESTree.Node, source: string): Array<SourceChar> => {
  const chars: Array<SourceChar> = [];

  const addChar = (
    char: string,
    originalPosition: Position,
    className: string = '',
  ) => {
    if (char.length !== 1) crash('Char must have length 1');
    chars.push({
      id: `s_${chars.length}`,
      char,
      className,
      originalPosition,
    });
  };

  const addString = (
    str: string,
    startPosition: Position,
    className: string = '',
  ) => {
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const position = startPosition.addOffset(i);
      addChar(char, position, className);
    }
  };

  const addChars = (node: ESTree.Node) => {
    switch (node.type) {
      case 'Program':
        node.body.forEach(statement => addChars(statement));
        return;
      case 'ExpressionStatement':
        addChars(node.expression);
        return;
      case 'BinaryExpression': {
        addChars(node.left);
        const leftEnd = assertExists(node.left.range)[1];
        const rightStart = assertExists(node.right.range)[0];
        const diff = rightStart - leftEnd;
        const position =
          diff >= node.operator.length + 2
            ? Position.fromNodeEnd(node.left, source).addOffset(1)
            : Position.fromNodeEnd(node.left, source);
        addString(node.operator, position);
        addChars(node.right);
        return;
      }
      case 'Literal':
        addString(
          assertExists(node.raw),
          Position.fromNodeStart(node, source),
          'text-purple',
        );
        return;
      case 'EmptyStatement':
      case 'BlockStatement':
      case 'IfStatement':
      case 'LabeledStatement':
      case 'BreakStatement':
      case 'ContinueStatement':
      case 'WithStatement':
      case 'SwitchStatement':
      case 'ReturnStatement':
      case 'ThrowStatement':
      case 'TryStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'DebuggerStatement':
      case 'FunctionDeclaration':
      case 'VariableDeclaration':
      case 'VariableDeclarator':
      case 'ThisExpression':
      case 'ArrayExpression':
      case 'ObjectExpression':
      case 'Property':
      case 'FunctionExpression':
      case 'SequenceExpression':
      case 'UnaryExpression':
      case 'AssignmentExpression':
      case 'UpdateExpression':
      case 'LogicalExpression':
      case 'ConditionalExpression':
      case 'CallExpression':
      case 'NewExpression':
      case 'MemberExpression':
      case 'SwitchCase':
      case 'CatchClause':
      case 'Identifier':
      case 'ForOfStatement':
      case 'Super':
      case 'SpreadElement':
      case 'ArrowFunctionExpression':
      case 'YieldExpression':
      case 'TemplateLiteral':
      case 'TaggedTemplateExpression':
      case 'TemplateElement':
      case 'ObjectPattern':
      case 'ArrayPattern':
      case 'RestElement':
      case 'AssignmentPattern':
      case 'ClassBody':
      case 'MethodDefinition':
      case 'ClassDeclaration':
      case 'ClassExpression':
      case 'MetaProperty':
      case 'ImportDeclaration':
      case 'ImportSpecifier':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
      case 'ExportNamedDeclaration':
      case 'ExportSpecifier':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
      case 'AwaitExpression':
        throw new Error(`Unimplemented AST node type: ${node.type}`);
      default: {
        throw spawnUnknownSwitchCaseError('Node.type', node);
      }
    }
  };

  addChars(node);
  return chars;
};

export default charsFromAst;
