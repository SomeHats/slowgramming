import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as esprima from 'esprima';
import * as ESTree from 'estree';
import assert from 'assert';
import { observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { CHAR_HEIGHT_EM } from './config';
import { assertExists, delay } from './util';
import { Line } from './types';
import LineRenderer from './LineRenderer';

const getStartIdx = (node: ESTree.Node | esprima.Token): number =>
  assertExists((node as any).range)[0];

const getEndIdx = (node: ESTree.Node | esprima.Token): number =>
  assertExists((node as any).range)[1];

const code = `
2 + 2 + 2 + 2

1 + 2 + 3
`.trim();

const program = esprima.parseModule(code, {
  range: true,
  tokens: true,
});

const tokens = assertExists(program.tokens);
const createWhitespaceToken = (char: string): esprima.Token => {
  assert(/^\s$/.test(char));
  return {
    type: 'Whitespace',
    value: char,
  };
};

const lines: Array<Line> = observable([
  { originalChars: [], additionalParts: [] },
]);
let line = lines[0];
(code + '\n').split('').forEach((char, i) => {
  const currentToken = tokens[0];
  if (currentToken == null) return;

  const tokenStart = getStartIdx(currentToken);
  const tokenEnd = getEndIdx(currentToken);
  if (tokenEnd === i + 1) tokens.shift();

  const token = i >= tokenStart ? currentToken : createWhitespaceToken(char);

  line.originalChars.push({
    value: char,
    key: `s${i}`,
    token,
    isHidden: false,
  });

  if (char === '\n') {
    line = observable({ originalChars: [], additionalParts: [] });
    lines.push(line);
  }
});

console.log(toJS(lines));

interface BlahProps {
  lines: Array<Line>;
}

@observer
class Blah extends React.Component<BlahProps> {
  render() {
    const { lines } = this.props;
    return (
      <div className="flex overflow-hidden rounded bg-grey-lightest m-4">
        <div className="flex-none bg-grey-lighter p-4 pr-2 text-right">
          {lines.map((line, i) => (
            <div
              key={i}
              className="font-mono text-grey m-r-4"
              style={{
                height: `${CHAR_HEIGHT_EM}em`,
                lineHeight: `${CHAR_HEIGHT_EM}em`,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="p-4 flex-auto relative">
          <div className="absolute pin my-4">
            {lines.map((line, i) => (
              <LineRenderer key={i} line={line} lineIdx={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

const go = async () => {
  await delay(500);

  const newChar1 = observable({
    value: '4',
    token: { type: 'Numeric', value: '4' },
    key: `d_${Math.random().toString(36)}`,
    isHidden: true,
    colIdx: 2,
  });
  lines[0].additionalParts.push(newChar1);

  await delay(0);

  lines[0].originalChars.slice(0, 5).forEach(char => {
    char.isHidden = true;
  });
  newChar1.isHidden = false;

  await delay(600);

  const newChar2 = observable({
    value: '6',
    token: { type: 'Numeric', value: '6' },
    key: `d_${Math.random().toString(36)}`,
    isHidden: true,
    colIdx: 4,
  });
  lines[0].additionalParts.push(newChar2);

  await delay(0);

  lines[0].originalChars.slice(5, 9).forEach(char => {
    char.isHidden = true;
  });
  newChar1.isHidden = true;
  newChar2.isHidden = false;

  await delay(600);

  const newChar3 = observable({
    value: '8',
    token: { type: 'Numeric', value: '8' },
    key: `d_${Math.random().toString(36)}`,
    isHidden: true,
    colIdx: 6,
  });
  lines[0].additionalParts.push(newChar3);

  await delay(0);

  lines[0].originalChars.slice(9, 13).forEach(char => {
    char.isHidden = true;
  });
  newChar2.isHidden = true;
  newChar3.isHidden = false;
};

go();

ReactDOM.render(<Blah lines={lines} />, document.getElementById('root'));
