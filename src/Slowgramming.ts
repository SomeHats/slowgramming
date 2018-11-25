import * as assert from 'assert';
import * as ESTree from 'estree';
import * as esprima from 'esprima';
import LineView from './vis/LineView';
import { CHAR_HEIGHT_EM } from './config';
import evaluate from './eval/evaluate';
import SourcePositionTracker from './lib/SourcePositionTracker';
import { delay } from './lib/util';

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
  private readonly lines: Array<LineView>;
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
    await evaluate(this.ast, {
      visualizer: {
        replaceRange: async (range: [number, number], newContent: string) => {
          const startPosition = this.sourcePositions.fromOriginalOffset(
            range[0],
          );
          const endPosition = this.sourcePositions.fromOriginalOffset(range[1]);
          assert.equal(
            startPosition.line,
            endPosition.line,
            'range must be contained within a single line',
          );

          this.sourcePositions.remove(
            startPosition,
            endPosition.offset - startPosition.offset,
          );
          this.sourcePositions.insert(startPosition, newContent);

          const line = this.lines[startPosition.line];
          await line.replaceRangeAnimated(
            startPosition.column,
            endPosition.column,
            newContent,
            this.speed,
          );

          await delay(this.speed * 0.5);
        },
      },
    });
  }
}
