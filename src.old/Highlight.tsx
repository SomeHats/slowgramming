import React from 'react';
import { CHAR_HEIGHT_EM, CHAR_WIDTH_EM } from './config';
import Position from './Position';

interface HighlightProps {
  range: {
    start: Position;
    end: Position;
  } | null;
}

interface HighlightState {
  start: Position | null;
  end: Position | null;
  isVisible: boolean;
}

class Highlight extends React.PureComponent<HighlightProps, HighlightState> {
  static getDerivedStateFromProps(
    { range }: Readonly<HighlightProps>,
    state: HighlightState,
  ): HighlightState {
    const start = range ? range.start : state.start;
    const end = range ? range.end : state.end;

    return {
      start,
      end,
      isVisible: range !== null,
    };
  }

  state: HighlightState = {
    start: null,
    end: null,
    isVisible: false,
  };

  render() {
    const { start, end, isVisible } = this.state;

    if (!start || !end) return null;

    const scaleX = ((end.column - start.column) * CHAR_WIDTH_EM) / 100;
    const scaleY = (1 * CHAR_HEIGHT_EM) / 100;
    const posX = start.column * CHAR_WIDTH_EM;
    const posY = start.line * CHAR_HEIGHT_EM;

    const transform = `translate(${posX}em, ${posY}em) scale(${scaleX}, ${scaleY})`;
    return (
      <div
        className="absolute z-20 bg-green-lighter transition"
        style={{
          width: '100em',
          height: '100em',
          transform,
          transformOrigin: 'top left',
          top: 0,
          left: 0,
          opacity: isVisible ? 1 : 0,
        }}
      />
    );
  }
}

export default Highlight;
