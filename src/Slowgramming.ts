import * as assert from 'assert';
import * as ESTree from 'estree';
import * as esprima from 'esprima';
import * as animate from './lib/animate';
import LineView from './vis/LineView';
import { CHAR_HEIGHT_EM } from './config';
import evaluate from './eval/evaluate';
import SourcePositionTracker from './lib/SourcePositionTracker';
import { delay } from './lib/util';
import { OffsetRange } from './types';

interface SlowgrammingDom {
  container: HTMLDivElement;
  lineNumbers: HTMLDivElement;
  lineContentContainer: HTMLDivElement;
  lineContent: HTMLDivElement;
}

const createBlankDom = (): SlowgrammingDom => {
  const container = document.createElement('div');
  container.className = 'flex overflow-hidden rounded bg-grey-lightest m-4';
  container.style.lineHeight = `${CHAR_HEIGHT_EM}em`;

  const lineNumbers = document.createElement('div');
  lineNumbers.className = 'flex-none bg-grey-lighter p-4 pr-2 text-right';
  container.appendChild(lineNumbers);

  const lineContentContainer = document.createElement('div');
  lineContentContainer.className = 'p-4 flex-auto relative';
  container.appendChild(lineContentContainer);

  const lineContent = document.createElement('div');
  lineContent.className = 'absolute pin my-4';
  lineContentContainer.appendChild(lineContent);

  return {
    container,
    lineNumbers,
    lineContentContainer,
    lineContent,
  };
};

const createLineNumberDom = (n: number): HTMLDivElement => {
  const el = document.createElement('div');
  el.textContent = n.toString(10);
  el.className = 'font-mono text-grey m-r-4';
  return el;
};

export default class Slowgramming {
  public readonly lines: Array<LineView>;
  private readonly dom: SlowgrammingDom;
  private readonly speed: number;
  private readonly ast: ESTree.Program;
  private readonly sourcePositions: SourcePositionTracker;

  constructor(source: string, speed: number = 1000) {
    this.dom = createBlankDom();
    this.lines = source.split('\n').map((line, i) => new LineView(i, line));
    this.lines.forEach((line, i) => {
      line.appendTo(this.dom.lineContent);
      this.dom.lineNumbers.appendChild(createLineNumberDom(i + 1));
    });
    this.speed = speed;
    this.ast = esprima.parseModule(source, {
      range: true,
      tokens: true,
    });

    this.sourcePositions = new SourcePositionTracker(source);
  }

  public appendTo(el: HTMLElement) {
    el.appendChild(this.dom.container);
  }

  public destroy() {
    if (this.dom.container.parentElement) {
      this.dom.container.parentElement.removeChild(this.dom.container);
    }
  }

  public async go() {
    const visualizer = {
      replaceRange: async (range: OffsetRange, newContent: string) => {
        const startPosition = this.sourcePositions.fromOriginalOffset(range[0]);
        const endPosition = this.sourcePositions.fromOriginalOffset(range[1]);
        assert.equal(
          startPosition.line,
          endPosition.line,
          'range must be contained within a single line',
        );

        this.sourcePositions.remove(startPosition.offset, endPosition.offset);
        if (newContent.length) {
          this.sourcePositions.insert(startPosition.offset, newContent);
        }

        const line = this.lines[startPosition.line];
        await line.replaceRangeAnimated(
          startPosition.column,
          endPosition.column,
          newContent,
          this.speed,
          { highlight: true },
        );

        await delay(this.speed * 0.5);
      },

      stringConcatenate: async (stringARange: OffsetRange, stringBRange: OffsetRange) => {
        const stringAStartPosition = this.sourcePositions.fromOriginalOffset(stringARange[0]);
        const stringAEndPosition = this.sourcePositions.fromOriginalOffset(stringARange[1]);
        const stringBStartPosition = this.sourcePositions.fromOriginalOffset(stringBRange[0]);
        const stringBEndPosition = this.sourcePositions.fromOriginalOffset(stringBRange[1]);
        assert.equal(
          stringAStartPosition.line,
          stringBEndPosition.line,
          'strings must be on same line',
        );

        const initalLength = stringBEndPosition.column - stringAStartPosition.column;
        const removeStart = stringAEndPosition.offset - 1;
        const removeEnd = stringBStartPosition.offset + 1;
        const removedLength = removeEnd - removeStart;
        this.sourcePositions.remove(stringAEndPosition.offset - 1, stringBStartPosition.offset + 1);

        const line = this.lines[stringAStartPosition.line];
        await Promise.all([
          line.removeRangeAnimated(
            stringAEndPosition.column - 1,
            stringBStartPosition.column + 1,
            this.speed,
          ),
          line.showTransformHighlight(
            stringAStartPosition.column,
            initalLength,
            initalLength - removedLength,
            'blue-lighter',
            animate.options(this.speed),
          ),
        ]);

        await delay(this.speed * 0.5);
      },
    };

    await evaluate(this.ast, {
      visualizer,
    });
  }
}
