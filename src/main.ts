import 'web-animations-js';
import { assertExists, delay } from './util';
import LineView from './LineView';

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
