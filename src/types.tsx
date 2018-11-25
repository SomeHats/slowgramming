import * as esprima from 'esprima';

export interface Char {
  value: string;
  key: string;
  token: esprima.Token;
  isHidden: boolean;
}

export interface AdditionalPart extends Char {
  colIdx: number;
}

export interface Line {
  originalChars: Array<Char>;
  additionalParts: Array<AdditionalPart>;
}
