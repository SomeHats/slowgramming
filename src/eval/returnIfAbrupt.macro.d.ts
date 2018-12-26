import * as JS from './JS';

declare function returnIfAbrupt(value: JS.LanguageValue | JS.Completion): JS.LanguageValue;

export default returnIfAbrupt;
