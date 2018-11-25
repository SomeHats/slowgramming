import React from 'react';
import { CHAR_HEIGHT_EM } from './config';

interface ActiveLineProps {
  line: number | null;
}

const ActiveLine = ({ line }: ActiveLineProps) => {
  const transform = `translateY(${((line || 1) - 1) * CHAR_HEIGHT_EM}em)`;

  return (
    <div
      className={`absolute pin-x transition z-10 bg-blue-lightest border border-l-4 border-r-0 border-blue-lighter`}
      style={{
        opacity: line === null ? 0 : 1,
        height: `${CHAR_HEIGHT_EM}em`,
        transform,
      }}
    />
  );
};

export default ActiveLine;
