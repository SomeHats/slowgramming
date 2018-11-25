import Position from './Position';

export interface SourceChar {
  id: string;
  char: string;
  className: string;
  originalPosition: Position;
}
