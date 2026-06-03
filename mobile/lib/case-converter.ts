import { camelCase, isObject, isArray } from 'lodash-es';

// --- These are advanced TypeScript "mapped types" that perform the case conversion at the type level ---

// This type converts a single snake_case string literal to a camelCase string literal
type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// This type recursively walks through an object and applies the SnakeToCamel conversion to its keys
type KeysToCamelCase<T> = T extends (infer U)[]
  ? KeysToCamelCase<U>[]
  : T extends object
    ? { [K in keyof T as SnakeToCamel<K & string>]: KeysToCamelCase<T[K]> }
    : T;

// --- End of advanced types ---

/**
 * Recursively converts all keys in an object or an array of objects
 * from snake_case to camelCase in a fully type-safe way.
 *
 * @param obj The object or array to convert (with snake_case keys).
 * @returns A new object or array with camelCase keys and fully inferred types.
 */
export function convertKeysToCamelCase<T extends object>(obj: T): KeysToCamelCase<T> {
  if (isArray(obj)) {
    return obj.map((v) => convertKeysToCamelCase(v)) as KeysToCamelCase<T>;
  }

  if (isObject(obj) && obj !== null && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = camelCase(key);
      const value = (obj as Record<string, unknown>)[key];
      (acc as Record<string, unknown>)[camelKey] = typeof value === 'object' && value !== null ? convertKeysToCamelCase(value as object) : value;
      return acc;
    }, {}) as KeysToCamelCase<T>;
  }

  return obj as KeysToCamelCase<T>;
}
