import { CHAR_WIDTH_EM } from './config';
import * as animate from './animate';

export default class CharRangeView {
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

    await animate.finish(animation);
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
    await animate.finish(animation);
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
    await animate.finish(animation);
  }

  async fadeOut(options: KeyframeAnimationOptions) {
    const animation = this.el.animate(
      {
        opacity: [1, 0],
      } as any,
      options,
    );
    await animate.finish(animation);
  }

  async fadeIn(options: KeyframeAnimationOptions) {
    const animation = this.el.animate(
      {
        opacity: [0, 1],
      } as any,
      options,
    );
    console.log(animation.finished);
    await animate.finish(animation);
  }
}
