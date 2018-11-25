import * as ESTree from 'estree';
import * as JS from './JS';
import { spawnUnknownSwitchCaseError, assertExists } from '../lib/util';

interface Visualizer {
  replaceRange(range: [number, number], newContent: string): Promise<void>;
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
  if (node.value === null) return new JS.NullValue();

  switch (typeof node.value) {
    case 'boolean':
      return new JS.BooleanValue(node.value);
    case 'number':
      return new JS.NumberValue(node.value);
    case 'string':
      return new JS.StringValue(node.value);
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
  let lVal = JS.getValue(lRef);

  // ReturnIfAbrupt
  if (lVal instanceof JS.Completion) {
    if (lVal.isAbrubt) return lVal;
    lVal = lVal.nonAbrubtValue;
  }

  // 3.
  const rRef = await evaluate(node.right, ctx);

  // 4.
  let rVal = JS.getValue(rRef);
  if (rVal instanceof JS.Completion) {
    if (rVal.isAbrubt) return rVal;
    rVal = rVal.nonAbrubtValue;
  }

  // 5.
  let lPrim = JS.toPrimitive(lVal);
  if (lPrim instanceof JS.Completion) {
    if (lPrim.isAbrubt) return lPrim;
    lPrim = lPrim.nonAbrubtValue;
  }

  // 6.
  let rPrim = JS.toPrimitive(rVal);
  if (rPrim instanceof JS.Completion) {
    if (rPrim.isAbrubt) return rPrim;
    rPrim = rPrim.nonAbrubtValue;
  }

  // 7.
  if (JS.type(lPrim) === 'String' || JS.type(rPrim) === 'String') {
    // 7.a.
    let lStr = JS.toString(lPrim);
    if (lStr instanceof JS.Completion) {
      if (lStr.isAbrubt) return lStr;
      lStr = lStr.nonAbrubtValue;
    }

    // 7.b.
    let rStr = JS.toString(rPrim);
    if (rStr instanceof JS.Completion) {
      if (rStr.isAbrubt) return rStr;
      rStr = rStr.nonAbrubtValue;
    }

    // 7.c.
    // TODO: animated string concatination
    if (lStr instanceof JS.StringValue && rStr instanceof JS.StringValue) {
      const result = new JS.StringValue(lStr.value + rStr.value);
      await ctx.visualizer.replaceRange(
        assertExists(node.range),
        `'${result.value}'`,
      );
      return result;
    } else {
      throw new Error('lStr and rStr must be string');
    }
  }

  // 8.
  let lNum = JS.toNumber(lPrim);
  if (lNum instanceof JS.Completion) {
    if (lNum.isAbrubt) return lNum;
    lNum = lNum.nonAbrubtValue;
  }

  // 9.
  let rNum = JS.toNumber(rPrim);
  if (rNum instanceof JS.Completion) {
    if (rNum.isAbrubt) return rNum;
    rNum = rNum.nonAbrubtValue;
  }

  // 10.
  if (lNum instanceof JS.NumberValue && rNum instanceof JS.NumberValue) {
    const result = new JS.NumberValue(lNum.value + rNum.value);
    await ctx.visualizer.replaceRange(
      assertExists(node.range),
      String(result.value),
    );
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
  let value = JS.getValue(exprRef);

  // ReturnIfAbrupt
  if (value instanceof JS.Completion) {
    if (value.isAbrubt) return value;
    value = value.nonAbrubtValue;
  }

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
    result = await evaluate(statement, ctx);

    // ReturnIfAbrupt
    if (result instanceof JS.Completion) {
      if (result.isAbrubt) return result;
      result = result.nonAbrubtValue;
    }
  }

  return result ? result : JS.normalCompletion(new JS.UndefinedValue());
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
