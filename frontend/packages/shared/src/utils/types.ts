/**
 * Utility types and type helpers
 */

/**
 * Make specific keys optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
/**
 * Make specific keys required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep partial type - makes all properties optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep required type - makes all properties required recursively
 */
export type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Remove null and undefined from type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract value types from an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Extract promise resolved type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract function return type
 */
export type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * Extract function parameters
 */
export type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;

/**
 * Extract constructor parameters
 */
export type ConstructorParameters<T> = T extends new (...args: infer P) => unknown ? P : never;

/**
 * Extract instance type from constructor
 */
export type InstanceType<T> = T extends new (...args: unknown[]) => infer R ? R : never;

/**
 * Make all properties readonly
 */
export type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

/**
 * Make all properties mutable
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * Pick properties by value type
 */
export type PickByValue<T, V> = Pick<T, {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T]>;

/**
 * Omit properties by value type
 */
export type OmitByValue<T, V> = Omit<T, {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T]>;

/**
 * Get keys of properties with specific value type
 */
export type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Get keys of properties that are not of specific type
 */
export type KeysNotOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? never : K;
}[keyof T];

/**
 * Union to intersection
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Last element of array
 */
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;

/**
 * First element of array
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;

/**
 * Tail of array (all elements except first)
 */
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : [];

/**
 * Prepend element to array
 */
export type Prepend<T, U extends readonly unknown[]> = [T, ...U];

/**
 * Append element to array
 */
export type Append<T, U extends readonly unknown[]> = [...U, T];

/**
 * Reverse array
 */
export type Reverse<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R] ? [...Reverse<R>, H] : [];

/**
 * String literal types
 */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

/**
 * Numeric literal types
 */
export type NumericLiteral<T> = T extends number ? (number extends T ? never : T) : never;

/**
 * Boolean literal types
 */
export type BooleanLiteral<T> = T extends boolean ? (boolean extends T ? never : T) : never;

/**
 * Branded types for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Nominal types using symbols
 */
export type Nominal<T, B extends symbol> = T & { readonly __nominal: B };

/**
 * Flatten nested arrays
 */
export type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;

/**
 * Deep flatten arrays
 */
export type DeepFlatten<T> = T extends (infer U)[] ? DeepFlatten<U> : T;

/**
 * Get nested property type
 */
export type NestedProperty<T, K extends string> = K extends keyof T
    ? T[K]
    : K extends `${infer P}.${infer S}`
    ? P extends keyof T
    ? NestedProperty<T[P], S>
    : never
    : never;

/**
 * Paths to all properties in an object
 */
export type Paths<T> = T extends object
    ? {
        [K in keyof T]: K extends string
        ? T[K] extends object
        ? `${K}.${Paths<T[K]>}`
        : K
        : never;
    }[keyof T]
    : never;

/**
 * Leaves of an object (properties that are not objects)
 */
export type Leaves<T> = T extends object
    ? {
        [K in keyof T]: T[K] extends object ? Leaves<T[K]> : K;
    }[keyof T]
    : never;

/**
 * Conditional types
 */
export type If<C extends boolean, T, F> = C extends true ? T : F;

/**
 * Equals type check
 */
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * Is never type
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Is any type
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Is unknown type
 */
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

/**
 * Is void type
 */
export type IsVoid<T> = [T] extends [void] ? true : false;

/**
 * Is null type
 */
export type IsNull<T> = [T] extends [null] ? true : false;

/**
 * Is undefined type
 */
export type IsUndefined<T> = [T] extends [undefined] ? true : false;

/**
 * Is null or undefined
 */
export type IsNullOrUndefined<T> = IsNull<T> extends true ? true : IsUndefined<T>;



/**
 * Non-undefined type
 */
export type NonUndefined<T> = T extends undefined ? never : T;

/**
 * Non-null type
 */
export type NonNull<T> = T extends null ? never : T;

/**
 * Function type helpers
 */
export type AnyFunction = (...args: unknown[]) => unknown;

export type AsyncFunction<T extends AnyFunction> = (...args: Parameters<T>) => Promise<ReturnType<T>>;

export type SyncFunction<T extends AnyFunction> = (...args: Parameters<T>) => ReturnType<T>;

/**
 * Event handler types
 */
export type EventHandler<T = Event> = (event: T) => void;

export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * Callback types
 */
export type Callback<T = void> = (value: T) => void;

export type AsyncCallback<T = void> = (value: T) => Promise<void>;

/**
 * Predicate types
 */
export type Predicate<T> = (value: T) => boolean;

export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

/**
 * Mapper types
 */
export type Mapper<T, U> = (value: T) => U;

export type AsyncMapper<T, U> = (value: T) => Promise<U>;

/**
 * Reducer types
 */
export type Reducer<T, U> = (accumulator: U, current: T) => U;

export type AsyncReducer<T, U> = (accumulator: U, current: T) => Promise<U>;
