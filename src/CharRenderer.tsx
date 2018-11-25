import React from 'react';
import { observer } from 'mobx-react';
import { Char } from './types';
import { CHAR_WIDTH_EM } from './config';

interface CharRendererProps {
  char: Char;
  charIdx: number;
}

@observer
class CharRenderer extends React.Component<CharRendererProps> {
  render() {
    const { char, charIdx } = this.props;
    if (char.token.type === 'Whitespace') return null;

    return (
      <div
        className={`font-mono absolute z-30 transition`}
        style={{
          transform: `translateX(${charIdx * CHAR_WIDTH_EM}em)`,
          opacity: char.isHidden ? 0 : 1,
        }}
      >
        {char.value}
      </div>
    );
  }
}

export default CharRenderer;
