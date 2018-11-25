import * as React from 'react';
import { CHAR_WIDTH_EM, CHAR_HEIGHT_EM } from './config';
import { SourceChar } from './types';

interface CharRendererProps {
  char: SourceChar;
}

const CharRenderer = ({ char }: CharRendererProps) => {
  const column = char.originalPosition.column * CHAR_WIDTH_EM;
  const line = char.originalPosition.line * CHAR_HEIGHT_EM;
  const transform = `translate(${column}em, ${line}em)`;
  return (
    <div
      className={`font-mono absolute z-30 ${char.className}`}
      style={{ transform, transition: `all 0.2s ease` }}
    >
      {char.char}
    </div>
  );
};

export default React.memo(CharRenderer);
