import { Vector3, world } from '@minecraft/server';

export type CreateDatabaseOptions<T, U> = {
  PROPERTY_MAX_SIZE?: number;
  PREFIX?: string;
  transformer?: U extends void ? never : DataTransformer<T, U>
}

export interface DataTransformer<T, U> {
  onWrite: (value: T) => U;
  onRead: (value: U) => T;
}

/**
 * T: The type of the value used in the database
 * U: (optional) The type of the value stored in the world
 */
export class ArrayDatabase<T, U = void> {
  public PROPERTY_MAX_SIZE = 12000;
  public PREFIX = 'array';

  private readonly cache: T[][] = [];
  private cacheLoaded = false;
  private currentKeyIndex = 0;
  private transformer: DataTransformer<T, U> | undefined;

  constructor(
    public readonly id: string,
    options: CreateDatabaseOptions<T, U> = {} as CreateDatabaseOptions<T, U>
  ) {
    if (options.PROPERTY_MAX_SIZE) this.PROPERTY_MAX_SIZE = options.PROPERTY_MAX_SIZE;
    if (options.PREFIX) this.PREFIX = options.PREFIX;
    if (options.transformer) this.transformer = options.transformer;
  }

  public getAll(): T[] {
    if (!this.cacheLoaded) this.load();
    const result: T[] = [];
    for (const value of this.cache) result.push(...value);
    return result;
  }

  public add(value: T): this {
    if (!this.cacheLoaded) this.load();
    const baseData = this.cache[this.currentKeyIndex] ?? [];
    baseData.push(value);
    this.trySave(baseData);
    return this;
  }

  public has(value: T): boolean {
    const locations = this.getAll();
    return locations.includes(value);
  }

  public clear(): void {
    const keys = world.getDynamicPropertyIds();
    const prefix = this.keyPrefix;
    for (const key of keys) {
      if (key.startsWith(prefix)) world.setDynamicProperty(key);
    }
    this.currentKeyIndex = 0;
    world.setDynamicProperty(this.indexKey);
    this.cache.length = 0;
  }

  public *values(): IterableIterator<T> {
    if (!this.cacheLoaded) this.load();
    for (const values of this.cache) {
      for (const value of values) {
        yield value;
      }
    }
  }

  public find(callbackfn: (value: T) => boolean): T | undefined {
    for (const value of this.values()) {
      if (callbackfn(value)) return value;
    }
    return undefined;
  }

  public filter(callbackfn: (value: T) => boolean): T[] {
    const result: T[] = [];
    for (const value of this.values()) {
      if (callbackfn(value)) result.push(value);
    }
    return result;
  }

  public map<U>(callbackfn: (value: T) => U): U[] {
    const result: U[] = [];
    for (const value of this.values()) {
      result.push(callbackfn(value));
    }
    return result;
  }

  public forEach(callbackfn: (value: T) => void): void {
    for (const value of this.values()) {
      callbackfn(value);
    }
  }

  public some(callbackfn: (value: T) => boolean): boolean {
    for (const value of this.values()) {
      if (callbackfn(value)) return true;
    }
    return false;
  }

  public every(callbackfn: (value: T) => boolean): boolean {
    for (const value of this.values()) {
      if (!callbackfn(value)) return false;
    }
    return true;
  }

  public [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }

  public get size(): number {
    return this.cache.reduce((acc, arr) => acc + arr.length, 0);
  }

  private trySave(values: T[], swap: T[] = [], index = this.currentKeyIndex): void {
    let sizeOK = true;
    const stringified = JSON.stringify(
      this.transformer ? values.map(this.transformer.onWrite) : values
    );
    if (stringified.length > this.PROPERTY_MAX_SIZE) {
      sizeOK = false;
    } else {
      try {
        world.setDynamicProperty(`${this.keyPrefix}${index}`, stringified);
        this.cache[index] = values;
      } catch (e) {
        sizeOK = false;
      }
    }
    
    if (!sizeOK) {
      if (values.length > 0) swap.push(values.shift()!);
      this.trySave(values, swap);
      this.currentKeyIndex++;
      world.setDynamicProperty(this.indexKey, this.currentKeyIndex);
      this.trySave(swap);
    }
  }

   private load() {
    this.currentKeyIndex = world.getDynamicProperty(this.indexKey) as number ?? 0;
    const keys = world.getDynamicPropertyIds();
    const prefix = this.keyPrefix;
    for (const key of keys) {
      if (!key.startsWith(prefix)) continue;
      const index = Number(key.slice(prefix.length));
      if (Number.isNaN(index)) {
        console.error(`[ArrayDatabase:${this.id}] Found invalid key: ${key}`);
        continue;
      }
      const parsed = JSON.parse(
        world.getDynamicProperty(key) as string ?? '[]'
      );
      this.cache[index] = this.transformer ? parsed.map(this.transformer.onRead) : parsed;
    }
    this.cacheLoaded = true;
  }

  private unload(): void {
    this.cache.length = 0;
    this.cacheLoaded = false;
    this.currentKeyIndex = 0;
  }

  private get keyPrefix(): string {
    return `${this.PREFIX}:${this.id}`;
  }

  private get indexKey(): string {
    return `${this.PREFIX}:index_${this.id}`;
  }

  public get [Symbol.toStringTag](): string {
    return this.id;
  }
}
