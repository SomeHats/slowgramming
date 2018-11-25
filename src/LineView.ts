import CharRangeView from './CharRangeView';
import * as animate from './animate';
import { CHAR_WIDTH_EM, CHAR_HEIGHT_EM } from './config';

export default class LineView {
  public el: HTMLDivElement = document.createElement('div');
  private _lineIdx: number = 0;
  private contentView: CharRangeView;
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

    await animate.finish(
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
      contentView.scaleToLengthAnimated(
        value.length,
        animate.options(duration),
      ),
      contentView.fadeOut(animate.options(duration * 0.6)),
      newContentView.scaleFromLengthAnimated(
        content.length,
        animate.options(duration),
      ),
      newContentView.fadeIn(animate.options(duration, 0.4)),
      afterView.setColIdxAnimated(
        startIdx + value.length,
        animate.options(duration),
      ),
      this.showTransformHighlight(
        startIdx,
        endIdx - startIdx,
        value.length,
        'blue-lighter',
        animate.options(duration),
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
