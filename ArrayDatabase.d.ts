export type CreateDatabaseOptions<T, U> = {
    PROPERTY_MAX_SIZE?: number;
    PREFIX?: string;
    transformer?: U extends void ? never : DataTransformer<T, U>;
};
export interface DataTransformer<T, U> {
    onWrite: (value: T) => U;
    onRead: (value: U) => T;
}
/**
 * T: The type of the value used in the database
 * U: (optional) The type of the value stored in the world
 */
export declare class ArrayDatabase<T, U = void> {
    readonly id: string;
    PROPERTY_MAX_SIZE: number;
    PREFIX: string;
    private readonly cache;
    private cacheLoaded;
    private currentKeyIndex;
    private transformer;
    constructor(id: string, options?: CreateDatabaseOptions<T, U>);
    getAll(): T[];
    add(value: T): this;
    has(value: T): boolean;
    clear(): void;
    values(): IterableIterator<T>;
    find(callbackfn: (value: T) => boolean): T | undefined;
    filter(callbackfn: (value: T) => boolean): T[];
    map<U>(callbackfn: (value: T) => U): U[];
    forEach(callbackfn: (value: T) => void): void;
    some(callbackfn: (value: T) => boolean): boolean;
    every(callbackfn: (value: T) => boolean): boolean;
    [Symbol.iterator](): IterableIterator<T>;
    get size(): number;
    private trySave;
    private load;
    private unload;
    private get keyPrefix();
    private get indexKey();
    get [Symbol.toStringTag](): string;
}
