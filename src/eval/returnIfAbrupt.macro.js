const assert = require('assert');
const { createMacro } = require('babel-plugin-macros');
const babelTemplate = require('@babel/template');
const babelTypes = require('@babel/types');

const returnIfAbruptTemplate = babelTemplate.statements(`
  let RESULT = INPUT;
  if (RESULT instanceof JS.Completion) {
    if (RESULT.isAbrupt) return RESULT;
    RESULT = RESULT.nonAbruptValue;
  }
`);

module.exports = createMacro(({ references, state, babel }) => {
  const refs = references.default;
  for (const ref of refs) {
    const callExpression = ref.parentPath;
    assert.equal(
      callExpression.type,
      'CallExpression',
      'returnIfAbrupt must be called as function',
    );
    const args = callExpression.node.arguments;
    assert.equal(args.length, 1, 'only 1 arg permitted to returnIfAbrupt');

    const input = args[0];
    const result = ref.scope.generateUidIdentifier('returnIfAbrupt');
    const statements = returnIfAbruptTemplate({
      RESULT: result,
      INPUT: input,
      JS: babelTypes.identifier('JS'),
    });

    callExpression.getStatementParent().insertBefore(statements);
    callExpression.replaceWith(result);
  }
});
