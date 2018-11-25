import React from 'react';
import { observer } from 'mobx-react';
import { Line } from './types';
import { CHAR_HEIGHT_EM } from './config';
import CharRenderer from './CharRenderer';

interface LineRendererProps {
  line: Line;
  lineIdx: number;
}

@observer
class LineRenderer extends React.Component<LineRendererProps> {
  render() {
    const { lineIdx, line } = this.props;

    let charIdx = 0;
    const charIdxs: Array<number> = [];
    return (
      <div
        className="absolute pin mx-4"
        style={{
          lineHeight: `${CHAR_HEIGHT_EM}em`,
          transform: `translateY(${lineIdx * CHAR_HEIGHT_EM}em)`,
        }}
      >
        {line.originalChars.map((char, i) => {
          charIdxs.push(charIdx);

          const additionalParts = line.additionalParts.filter(
            part => !part.isHidden && part.colIdx === i,
          );

          for (const additionalPart of additionalParts) {
            charIdx += additionalPart.value.length;
          }

          const el = (
            <CharRenderer char={char} charIdx={charIdx} key={char.key} />
          );
          if (!char.isHidden) charIdx += 1;
          return el;
        })}

        {line.additionalParts.map((char, i) => (
          <CharRenderer
            char={char}
            charIdx={charIdxs[char.colIdx]}
            key={char.key}
          />
        ))}
      </div>
    );
  }
}

export default LineRenderer;
