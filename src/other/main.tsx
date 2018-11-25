import 'web-animations-js';
import { assertExists, delay } from '../../src.old/util';

export const CHAR_HEIGHT_EM = 1.4;
export const CHAR_WIDTH_EM = 0.6025;

const finish = (animation: Animation): Promise<void> => {
  if (animation.finished) {
    return animation.finished.then(() => {});
  }
  return new Promise(resolve => {
    animation.onfinish = () => resolve();
  });
};

const animOptions = (
  duration: number,
  delay: number = 0,
): KeyframeAnimationOptions => ({
  duration: duration * (1 - delay),
  delay: duration * delay,
  fill: 'both',
  easing: 'ease-in-out',
});

class CharRangeView {
  public el: HTMLDivElement = document.createElement('div');
  private colIdx: number = 0;
  private content: string;

  constructor(content: string, colIdx: number, className: string = '') {
    this.el.textContent = content;
    this.el.className = `font-mono absolute z-30 transition whitespace-pre ${className}`;
    this.el.style.transform = `translateX(${colIdx * CHAR_WIDTH_EM}em)`;
    this.el.style.transformOrigin = 'top left';
    this.colIdx = colIdx;
    this.content = content;
  }

  setContent(content: string) {
    this.el.textContent = content;
    this.content = content;
  }

  async setColIdxAnimated(newValue: number, options: KeyframeAnimationOptions) {
    const animation = this.el.animate(
      {
        transform: [
          `translateX(${this.colIdx * CHAR_WIDTH_EM}em)`,
          `translateX(${newValue * CHAR_WIDTH_EM}em)`,
        ],
      } as any,
      options,
    );
    this.colIdx = newValue;

    await finish(animation);
  }

  async scaleToLengthAnimated(
    newLength: number,
    options: KeyframeAnimationOptions,
  ) {
    const ratio = newLength / this.content.length;

    const animation = this.el.animate(
      {
        transform: [
          `translateX(${this.colIdx * CHAR_WIDTH_EM}em) scaleX(1)`,
          `translateX(${this.colIdx * CHAR_WIDTH_EM}em) scaleX(${ratio})`,
        ],
      } as any,
      options,
    );
    await finish(animation);
  }

  async scaleFromLengthAnimated(
    oldLength: number,
    options: KeyframeAnimationOptions,
  ) {
    const ratio = oldLength / this.content.length;

    const animation = this.el.animate(
      {
        transform: [
          `translateX(${this.colIdx * CHAR_WIDTH_EM}em) scaleX(${ratio})`,
          `translateX(${this.colIdx * CHAR_WIDTH_EM}em) scaleX(1)`,
        ],
      } as any,
      options,
    );
    await finish(animation);
  }

  async fadeOut(options: KeyframeAnimationOptions) {
    const animation = this.el.animate(
      {
        opacity: [1, 0],
      } as any,
      options,
    );
    await finish(animation);
  }

  async fadeIn(options: KeyframeAnimationOptions) {
    const animation = this.el.animate(
      {
        opacity: [0, 1],
      } as any,
      options,
    );
    console.log(animation.finished);
    await finish(animation);
  }
}

class LineView {
  public el: HTMLDivElement = document.createElement('div');
  private _lineIdx: number = 0;
  private contentView: CharRangeView;
  // private tempAnimationViews: Array<CharRangeView> | null = null;
  private content: string;

  constructor(lineIdx: number, content: string) {
    this.el.className = 'absolute pin mx-4';
    this.el.style.lineHeight = `${CHAR_HEIGHT_EM}em`;
    this.lineIdx = lineIdx;
    this.content = content;

    this.contentView = new CharRangeView(content, 0);
    this.el.appendChild(this.contentView.el);
  }

  appendTo(el: HTMLElement) {
    el.appendChild(this.el);
  }

  set lineIdx(value: number) {
    this._lineIdx = value;
    this.el.style.transform = `translateY(${value * CHAR_HEIGHT_EM}em)`;
  }

  get lineIdx(): number {
    return this._lineIdx;
  }

  async showTransformHighlight(
    startIdx: number,
    initialLength: number,
    endLength: number,
    color: string,
    options: KeyframeAnimationOptions,
  ): Promise<void> {
    const translate = `translate(${startIdx * CHAR_WIDTH_EM}em)`;
    console.log({ startIdx, initialLength, endLength, color, options });

    const el = document.createElement('div');
    el.className = `absolute z-20 transition bg-${color}`;
    el.style.transformOrigin = 'top left';
    el.style.height = `${CHAR_HEIGHT_EM}em`;
    el.style.width = `${CHAR_WIDTH_EM}em`;
    this.el.appendChild(el);

    await finish(
      el.animate(
        {
          transform: [
            `${translate} scaleX(${initialLength})`,
            `${translate} scaleX(${endLength})`,
          ],
          opacity: [0, 1, 1, 1, 0],
        } as any,
        options,
      ),
    );

    this.el.removeChild(el);
  }

  async replaceRangeAnimated(
    startIdx: number,
    endIdx: number,
    value: string,
    duration: number,
  ) {
    this.el.removeChild(this.contentView.el);

    const before = this.content.slice(0, startIdx);
    const content = this.content.slice(startIdx, endIdx);
    const after = this.content.slice(endIdx);

    const beforeView = new CharRangeView(before, 0);
    const contentView = new CharRangeView(content, startIdx);
    const newContentView = new CharRangeView(value, startIdx);
    const afterView = new CharRangeView(after, endIdx);

    this.el.appendChild(beforeView.el);
    this.el.appendChild(contentView.el);
    this.el.appendChild(newContentView.el);
    this.el.appendChild(afterView.el);

    await Promise.all([
      contentView.scaleToLengthAnimated(value.length, animOptions(duration)),
      contentView.fadeOut(animOptions(duration * 0.6)),
      newContentView.scaleFromLengthAnimated(
        content.length,
        animOptions(duration),
      ),
      newContentView.fadeIn(animOptions(duration, 0.4)),
      afterView.setColIdxAnimated(
        startIdx + value.length,
        animOptions(duration),
      ),
      this.showTransformHighlight(
        startIdx,
        endIdx - startIdx,
        value.length,
        'blue-lighter',
        animOptions(duration),
      ),
    ]);

    this.el.removeChild(beforeView.el);
    this.el.removeChild(contentView.el);
    this.el.removeChild(newContentView.el);
    this.el.removeChild(afterView.el);

    this.content = `${before}${value}${after}`;
    this.contentView.setContent(this.content);
    this.el.appendChild(this.contentView.el);
  }
}

const lineContent = assertExists(document.getElementById('lineContent'));

const line1 = new LineView(0, '1 + 2 + 3 + 4');
line1.appendTo(lineContent);

const go = async (speed: number = 1000) => {
  await delay(speed);
  await line1.replaceRangeAnimated(0, 5, '3', speed);
  await delay(speed * 0.5);
  await line1.replaceRangeAnimated(0, 5, '6', speed);
  await delay(speed * 0.5);
  await line1.replaceRangeAnimated(0, 5, '10', speed);
};

go(400);
