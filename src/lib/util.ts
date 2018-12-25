let lastId = 0;
export const genId = (): string => `${Date.now().toString(36)}.${(lastId++).toString(36)}`;

export type Class<T> = {
  new (...args: any[]): T;
};

export const crash = (msg: string): never => {
  throw new Error(msg);
};

export function assertExists<T>(value: T | null | void | undefined): T {
  if (value != null) return value;
  return crash('required value does not exist');
}

export const spawnUnknownSwitchCaseError = (type: string, value: never): Error => {
  return new Error(`Unknown ${type}: ${value}`);
};

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(() => resolve(), ms));

export const isNegativeZero = (n: number): boolean => n === 0 && 1 / n < 0;
export const isPositiveZero = (n: number): boolean => n === 0 && 1 / n > 0;
