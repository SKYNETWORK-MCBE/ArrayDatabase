export declare class ArrayDatabase<T = any> {
    readonly id: string;
    static readonly PROPERTY_MAX_SIZE = 12000;
    static readonly PREFIX = "array";
    private readonly cache;
    private cacheLoaded;
    private currentKeyIndex;
    constructor(id: string);
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
    private trySave;
    get size(): number;
    private load;
    private unload;
    private get keyPrefix();
    private get currentKey();
    private get indexKey();
    get [Symbol.toStringTag](): string;
}
