import * as assert from 'assert';
import { crash } from '../lib/util';
import { OffsetRange } from '../types';

// #5.2.3.4 ReturnIfAbrubt shorthands
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-returnifabrupt-shorthands
// ! is shorthand for assertNotAbrubt (kind of)
export const assertNotAbrubt = (value: Value): Value => {
  if (value instanceof Completion) {
    assert.equal(type(value), 'Completion');
    assert(!value.isAbrubt);
    if (isEmpty(value.value)) {
      crash('value cannot be empty');
    } else {
      return value.value;
    }
  }

  return value;
};

// #6.1 ECMAScript Language Types
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types

export const type = <T extends string>(value: BaseValue<T>): T =>
  value.valueType;

export type LanguageValue =
  | UndefinedValue
  | NullValue
  | BooleanValue
  | StringValue
  | SymbolValue
  | NumberValue
  | ObjectValue;

export type SpecificationValue = List<any> | Completion | Reference;

export type Value = LanguageValue | SpecificationValue;

export class Empty {}
export const empty: Empty = new Empty();
export const isEmpty = (value: any): value is Empty => {
  return value instanceof Empty;
};

export class BaseValue<Type extends string> {
  public readonly valueType: Type;
  public readonly sourceRange: OffsetRange | null;
  public constructor(type: Type, sourceRange: OffsetRange | null) {
    this.valueType = type;
    this.sourceRange = sourceRange || null;
  }
}

// #6.1.1 The Undefined Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-undefined-type
export class UndefinedValue extends BaseValue<'Undefined'> {
  public readonly value: undefined = undefined;
  public constructor(sourceRange: OffsetRange | null) {
    super('Undefined', sourceRange);
  }
}

// #6.1.2 The Null Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-null-type
export class NullValue extends BaseValue<'Null'> {
  public readonly value: null = null;
  public constructor(sourceRange: OffsetRange | null) {
    super('Null', sourceRange);
  }
}

// #6.1.3 The Boolean Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-boolean-type
export class BooleanValue extends BaseValue<'Boolean'> {
  public readonly value: boolean;
  public constructor(value: boolean, sourceRange: OffsetRange | null) {
    super('Boolean', sourceRange);
    this.value = value;
  }
}

// #6.1.4 The String Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-string-type
export class StringValue extends BaseValue<'String'> {
  public readonly value: string;
  public constructor(value: string, sourceRange: OffsetRange | null) {
    super('String', sourceRange);
    this.value = value;
  }
}

// #6.1.5 The Symbol Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-symbol-type
export class SymbolValue extends BaseValue<'Symbol'> {
  public readonly value: symbol;
  public constructor(value: symbol, sourceRange: OffsetRange | null) {
    super('Symbol', sourceRange);
    this.value = value;
  }
}

// #6.1.5.1 Well-Known Symbols
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-well-known-symbols
// TODO: implement well known symbols

// #6.16 The Number Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ecmascript-language-types-number-type
export class NumberValue extends BaseValue<'Number'> {
  public readonly value: number;
  public constructor(value: number, sourceRange: OffsetRange | null) {
    super('Number', sourceRange);
    this.value = value;
  }
}

// #6.1.7 The Object Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-object-type
export class ObjectValue extends BaseValue<'Object'> {
  public readonly value: symbol;
  public constructor(sourceRange: OffsetRange | null) {
    super('Object', sourceRange);

    // TODO: implement objects
    throw new Error('Objects are not implemented');
  }
}

// #6.2.1 The List and Record Specification Types
export class List<T> extends BaseValue<'List'> {
  public readonly items: Array<T>;
  public constructor(items: Array<T>, sourceRange: OffsetRange | null) {
    super('List', sourceRange);
    this.items = items;
  }
}

export class Record<Type extends string> extends BaseValue<Type> {
  public constructor(type: Type, sourceRange: OffsetRange | null) {
    super(type, sourceRange);
  }
}

// #6.2.3 The Completion Record Specification Type
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-completion-record-specification-type
type CompletionType = 'normal' | 'break' | 'continue' | 'return' | 'throw';
export class Completion extends Record<'Completion'> {
  public readonly type: CompletionType;
  public readonly value: LanguageValue | Empty;
  public readonly target: string | Empty;

  public static fromCompletion({
    type,
    value,
    target,
    sourceRange,
  }: Completion) {
    return new Completion(type, value, target, sourceRange);
  }

  public constructor(
    type: CompletionType,
    value: LanguageValue | Empty,
    target: string | Empty,
    sourceRange: OffsetRange | null,
  ) {
    super('Completion', sourceRange);
    this.type = type;
    this.value = value;
    this.target = target;
  }

  public get isAbrubt(): boolean {
    return this.type !== 'normal';
  }

  public get nonAbrubtValue(): LanguageValue {
    assert(!this.isAbrubt);
    if (isEmpty(this.value)) {
      throw new Error('value must not be empty');
    }
    return this.value;
  }
}

// #6.2.3.2 NormalCompletion
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-normalcompletion
export const normalCompletion = (
  value: LanguageValue | Empty,
  sourceRange: OffsetRange | null,
): Completion => {
  return new Completion('normal', value, empty, sourceRange);
};

// #6.2.3.3 ThrowCompletion
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-throwcompletion
export const throwCompletion = (
  value: LanguageValue | Empty,
  sourceRange: OffsetRange | null,
): Completion => {
  return new Completion('throw', value, empty, sourceRange);
};

// #6.2.3.4 UpdateEmpty
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-updateempty
export const updateEmpty = (
  completionRecord: Completion,
  value: LanguageValue,
): Completion => {
  // 1.
  if (completionRecord.type === 'return' || completionRecord.type === 'throw') {
    assert(!isEmpty(value), 'value must not be empty');
  }

  // 2.
  if (!isEmpty(completionRecord.value)) {
    return Completion.fromCompletion(completionRecord);
  }

  // 3.
  return new Completion(
    completionRecord.type,
    value,
    completionRecord.target,
    completionRecord.sourceRange,
  );
};

// #6.2.4 The Reference Specification Type
type ReferenceBaseValue =
  | UndefinedValue
  | ObjectValue
  | BooleanValue
  | StringValue
  | SymbolValue
  | NumberValue;
export class Reference extends Record<'Reference'> {
  // TODO: base value can also be EnvironmentRecord
  public baseValue: ReferenceBaseValue;
  public referencedName: StringValue | SymbolValue;
  public isStrict: boolean;

  constructor(
    baseValue: ReferenceBaseValue,
    referencedName: StringValue | SymbolValue,
    strictReference: boolean,
    sourceRange: OffsetRange | null,
  ) {
    super('Reference', sourceRange);
    this.baseValue = baseValue;
    this.referencedName = referencedName;
    this.isStrict = strictReference;
  }
}

// #6.2.4.1 GetBase
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-getbase
export const getBase = (value: Reference): ReferenceBaseValue => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  return value.baseValue;
};

// #6.2.4.2 GetReferencedName
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-getreferencedname
export const getReferencedName = (value: Reference): ReferenceBaseValue => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  return value.referencedName;
};

// #6.2.4.3 IsStrictReference
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-isstrictreference
export const isStrictReference = (value: Reference): boolean => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  return value.isStrict;
};

// #6.2.4.4 HasPrimitiveBase
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-hasprimitivebase
export const hasPrimitiveBase = (value: Reference): boolean => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  const baseType = type(value.baseValue);
  return (
    baseType === 'Boolean' ||
    baseType === 'String' ||
    baseType === 'Symbol' ||
    baseType === 'Number'
  );
};

// #6.2.4.5 IsPropertyReference
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-ispropertyreference
export const isPropertyReference = (value: Reference): boolean => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  return hasPrimitiveBase(value) || type(value.baseValue) === 'Object';
};

// #6.2.4.6 IsUnresolvableReference
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-isunresolvablereference
export const isUnresolvableReference = (value: Reference): boolean => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  return type(value.baseValue) === 'Undefined';
};

// #6.2.4.7 IsSuperReferece
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-issuperreference
export const isSuperReference = (value: Reference): boolean => {
  // 1.
  assert(value instanceof Reference, 'value must be instanceof reference');

  // 2.
  // TODO: implement this
  throw new Error('IsSuperReference is unimplemented');
};

// #6.2.4.8 GetValue
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-getvalue
export const getValue = (
  value: LanguageValue | Reference | Completion,
): LanguageValue | Completion => {
  // 1.
  if (value instanceof Completion) {
    assert.equal(type(value), 'Completion');
    if (value.isAbrubt) return value;
    value = value.nonAbrubtValue;
  }

  // 2.
  if (!(value instanceof Reference)) {
    assert.notEqual(type(value), 'Reference');
    return value;
  }

  // 3.
  const base = getBase(value);

  // 4.
  if (isUnresolvableReference(value)) {
    // TODO: better throw, maybe?
    throw new ReferenceError('Unresovable reference');
  }

  // 5.
  if (isPropertyReference(value)) {
    // 4.a
    if (hasPrimitiveBase(value)) {
      // 4.a.i
      assert.notEqual(type(base), 'Undefined');
      assert.notEqual(type(base), 'Null');

      // 4.a.ii
      // TODO: objects
      throw new Error('toObject is not implemented');
    }

    // 4.b
    // TODO: Objects
    throw new Error('Object.[[Get]] is not implemented');
  }

  // 6.
  // TODO: Environmental record
  throw new Error('Environmental records not implemented');
};

// #7.1.1 ToPrimitive
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive
export const toPrimitive = (input: LanguageValue, preferredType?: string) => {
  // 2.
  if (type(input) === 'Object') {
    // TODO: finish this
    throw new Error('objects not yet supported');
  }

  // 3.
  return input;
};

// # 7.1.3 ToNumber
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-tonumber
export const toNumber = (input: LanguageValue): LanguageValue | Completion => {
  switch (input.valueType) {
    case 'Undefined':
      return new NumberValue(NaN, input.sourceRange);
    case 'Null':
      return new NumberValue(+0, input.sourceRange);
    case 'Boolean':
      return new NumberValue(input.value ? 1 : +0, input.sourceRange);
    case 'Number':
      return input;
    case 'String':
      return new NumberValue(Number(input.value), input.sourceRange);
    case 'Symbol':
      // TODO: return a throw completion instead
      throw new TypeError('Cannot convert a Symbol value to a number');
    case 'Object': {
      let primValue = toPrimitive(input, 'number');
      if (primValue instanceof Completion) {
        if (primValue.isAbrubt) return primValue;
        primValue = primValue.nonAbrubtValue;
      }

      let numberValue = toNumber(primValue);
      if (numberValue instanceof Completion) {
        if (numberValue.isAbrubt) return numberValue;
        numberValue = numberValue.nonAbrubtValue;
      }

      return numberValue;
    }
  }
};

// #7.1.12 ToString
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-tostring
export const toString = (input: LanguageValue): LanguageValue | Completion => {
  switch (input.valueType) {
    case 'Undefined':
      return new StringValue('undefined', input.sourceRange);
    case 'Null':
      return new StringValue('null', input.sourceRange);
    case 'Boolean':
      return new StringValue(input.value ? 'true' : 'false', input.sourceRange);
    case 'Number':
      return new StringValue(input.value.toString(), input.sourceRange);
    case 'String':
      return input;
    case 'Symbol':
      // TODO: return a throw completion instead
      throw new TypeError('Cannot convert a Symbol value to a string');
    case 'Object': {
      let primValue = toPrimitive(input, 'string');
      if (primValue instanceof Completion) {
        if (primValue.isAbrubt) return primValue;
        primValue = primValue.nonAbrubtValue;
      }

      let stringValue = toString(primValue);
      if (stringValue instanceof Completion) {
        if (stringValue.isAbrubt) return stringValue;
        stringValue = stringValue.nonAbrubtValue;
      }

      return stringValue;
    }
  }
};

// #7.1.13 ToObject
// https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toobject
// TODO: implement this
export const toObject = (input: LanguageValue): ObjectValue => {
  throw new Error('ToObject is not yet implemented');
};
