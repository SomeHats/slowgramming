import * as ESTree from 'estree';
import * as JS from './JS';
import { spawnUnknownSwitchCaseError, assertExists } from '../lib/util';
import { OffsetRange } from '../types';
import returnIfAbrupt from './returnIfAbrupt.macro';

interface Visualizer {
  replaceRange(range: OffsetRange, newContent: string): Promise<void>;
  stringConcatenate(rangeA: OffsetRange, rangeB: OffsetRange): Promise<void>;
}

interface EvalContext {
  visualizer: Visualizer;
}

// #12.2.4
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-primary-expression-literals
const evaluateLiteral = async (
  node: ESTree.Literal,
  ctx: EvalContext,
): Promise<JS.LanguageValue> => {
  const sourceRange = assertExists(node.range);
  if (node.value === null) return new JS.NullValue(sourceRange);

  switch (typeof node.value) {
    case 'boolean':
      return new JS.BooleanValue(node.value, sourceRange);
    case 'number':
      return new JS.NumberValue(node.value, sourceRange);
    case 'string':
      return new JS.StringValue(node.value, sourceRange);
    default:
      throw new Error(`Unknown literal type: ${typeof node.type}`);
  }
};

// #12.8.3 The Addition Operator
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-addition-operator-plus
const evaluateAdditionOperator = async (
  node: ESTree.BinaryExpression,
  ctx: EvalContext,
): Promise<JS.LanguageValue | JS.Completion> => {
  // 1.
  const lRef = await evaluate(node.left, ctx);

  // 2.
  const lVal = returnIfAbrupt(JS.getValue(lRef));

  // 3.
  const rRef = await evaluate(node.right, ctx);

  // 4.
  const rVal = returnIfAbrupt(JS.getValue(rRef));

  // 5.
  const lPrim = returnIfAbrupt(JS.toPrimitive(lVal));

  // 6.
  const rPrim = returnIfAbrupt(JS.toPrimitive(rVal));

  // 7.
  if (JS.type(lPrim) === 'String' || JS.type(rPrim) === 'String') {
    // 7.a.
    const lStr = returnIfAbrupt(JS.toString(lPrim));

    // 7.b.
    const rStr = returnIfAbrupt(JS.toString(rPrim));

    // 7.c.
    if (lStr instanceof JS.StringValue && rStr instanceof JS.StringValue) {
      const sourceRange = assertExists(node.range);
      const result = new JS.StringValue(lStr.value + rStr.value, sourceRange);
      await ctx.visualizer.stringConcatenate(
        assertExists(lStr.sourceRange),
        assertExists(rStr.sourceRange),
      );
      return result;
    } else {
      throw new Error('lStr and rStr must be string');
    }
  }

  // 8.
  const lNum = returnIfAbrupt(JS.toNumber(lPrim));

  // 9.
  const rNum = returnIfAbrupt(JS.toNumber(rPrim));

  // 10.
  if (lNum instanceof JS.NumberValue && rNum instanceof JS.NumberValue) {
    const sourceRange = assertExists(node.range);
    const result = new JS.NumberValue(lNum.value + rNum.value, sourceRange);
    await ctx.visualizer.replaceRange(sourceRange, String(result.value));
    return result;
  } else {
    throw new Error('lNum and rNum must be number');
  }
};

// #13.5 Expression Statement
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-expression-statement
const evaluateExpressionStatement = async (
  statement: ESTree.ExpressionStatement,
  ctx: EvalContext,
): Promise<JS.LanguageValue | JS.Completion> => {
  // 1.
  const exprRef = await evaluate(statement.expression, ctx);

  // 2.
  let value = returnIfAbrupt(JS.getValue(exprRef));

  console.log('expression statement', value);

  return value;
};

// #15.2.1.20 Module Runtime Evaluation Semantics
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-module-semantics-runtime-semantics-evaluation
const evaluateProgram = async (
  program: ESTree.Program,
  ctx: EvalContext,
): Promise<JS.LanguageValue | JS.Completion> => {
  // TODO hoisting etc
  let result;
  for (const statement of program.body) {
    result = returnIfAbrupt(await evaluate(statement, ctx));
  }

  return result ? result : JS.normalCompletion(new JS.UndefinedValue(null), null);
};

const evaluate = async (
  node: ESTree.Node,
  ctx: EvalContext,
): Promise<JS.LanguageValue | JS.Completion> => {
  // ctx.visualizer.setActiveLine(assertExists(node.loc).start.line);

  switch (node.type) {
    case 'BinaryExpression': {
      switch (node.operator) {
        case '+': // #12.8.3
          return evaluateAdditionOperator(node, ctx);
        default:
          // TODO: make this switch exhaustive
          throw new Error(`Unknown binary operator: ${node.operator}`);
      }
    }
    case 'ExpressionStatement': // #13.5
      return evaluateExpressionStatement(node, ctx);
    case 'Program': // #15.2.1.20
      return evaluateProgram(node, ctx);
    case 'Literal': // #12.2.4
      return evaluateLiteral(node, ctx);
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

export default evaluate;
