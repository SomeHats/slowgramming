import React from 'react';
import * as esprima from 'esprima';
import * as ESTree from 'estree';
import { times } from 'lodash';
import { assertExists } from './util';
import { SourceChar } from './types';
import charsFromAst from './charsFromAst';
import { CHAR_HEIGHT_EM } from './config';
import CharRenderer from './CharRenderer';
import ActiveLine from './ActiveLine';
import evaluate from './evaluate';
import Position from './Position';
import Highlight from './Highlight';

interface SlowgrammingProps {
  code: string;
}

interface SlowgrammingState {
  ast: ESTree.Program | null;
  lastCode: string;
  chars: Array<SourceChar>;
  activeLine: number | null;
  highlight: { start: Position; end: Position } | null;
}

class Slowgramming extends React.PureComponent<
  SlowgrammingProps,
  SlowgrammingState
> {
  static getDerivedStateFromProps(
    { code }: SlowgrammingProps,
    state: SlowgrammingState,
  ): SlowgrammingState {
    if (state && state.lastCode !== code) {
      throw new Error('Code cannot change');
    }

    const ast = esprima.parseModule(code, {
      range: true,
      loc: true,
      tokens: true,
    });

    const chars = charsFromAst(ast, code);

    return {
      ...state,
      chars,
      ast,
    };
  }

  state: SlowgrammingState = {
    ast: null,
    chars: [],
    lastCode: this.props.code,
    activeLine: null,
    highlight: null,
  };

  setActiveLine = (line: number) => {
    this.setState(({ activeLine }) => {
      if (activeLine === line) return null;
      return { activeLine: line };
    });
  };

  highlightAstNode = (node: ESTree.Node) => {
    const { code } = this.props;
    const start = Position.fromNodeStart(node, code);
    const end = Position.fromNodeEnd(node, code);

    if (start.line !== end.line) {
      throw new Error('Cannot highlight over multiple lines');
    }

    this.setState({ highlight: { start, end } });
  };

  clearHighlight = () => {
    this.setState({ highlight: null });
  };

  hideChars = () => {};

  async evaluate(node: ESTree.Node) {
    evaluate(node, { visualizer: this });
  }

  render() {
    const { code } = this.props;
    const { ast, chars, activeLine, highlight } = this.state;

    if (!ast) return null;
    const lines = assertExists(ast.loc).end.line;

    return (
      <div>
        <div className="flex overflow-hidden rounded bg-grey-lightest m-4">
          <div className="flex-none bg-grey-lighter p-4 pr-2 text-right">
            {times(lines, line => (
              <div
                key={line}
                className="font-mono text-grey m-r-4"
                style={{
                  height: `${CHAR_HEIGHT_EM}em`,
                  lineHeight: `${CHAR_HEIGHT_EM}em`,
                }}
              >
                {line + 1}
              </div>
            ))}
          </div>
          <div className="p-4 flex-auto relative">
            <div className="absolute pin my-4">
              <ActiveLine line={activeLine} />
              <div
                className="absolute pin mx-4"
                style={{ lineHeight: `${CHAR_HEIGHT_EM}em` }}
              >
                <Highlight range={highlight} />

                {chars.map(char => (
                  <CharRenderer char={char} key={char.id} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          className="m-4 p-2 bg-purple-lightest text-purple-dark rounded border border-transparent hover:border-purple-lighterb focus:border-purple focus:outline-none"
          onClick={() => this.evaluate(ast)}
        >
          Start
        </button>

        <div className="font-mono text-black">
          <pre>{code}</pre>
          <pre>{JSON.stringify({ ast, chars }, null, 2)}</pre>
        </div>
      </div>
    );
  }
}

export default Slowgramming;
