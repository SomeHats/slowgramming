import '@babel/polyfill';
import 'web-animations-js';
import Slowgramming from './Slowgramming';
import { assertExists } from './lib/util';

const source = `
1 + 2 + 3 + 4
11 + 2 + 4
'hello ' + 'world'
'hello' + ' ' + 'world'
'hello ' + 123
`.trim();

const slowgramming = new Slowgramming(source, 800);
const root = assertExists(document.getElementById('root'));
slowgramming.appendTo(root);
(window as any).slowgramming = slowgramming;

slowgramming.go();

// const lineContent = assertExists(document.getElementById('lineContent'));

// const line1 = new LineView(0, '1 + 2 + 3 + 4');
// line1.appendTo(lineContent);

// const go = async (speed: number = 1000) => {
//   await delay(speed);
//   await line1.replaceRangeAnimated(0, 5, '3', speed);
//   await delay(speed * 0.5);
//   await line1.replaceRangeAnimated(0, 5, '6', speed);
//   await delay(speed * 0.5);
//   await line1.replaceRangeAnimated(0, 5, '10', speed);
// };

// go(400);

if ((module as any).hot) {
  const hot = (module as any).hot;
  hot.dispose(() => {
    slowgramming.destroy();
  });
}
