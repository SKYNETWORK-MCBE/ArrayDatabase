import { world } from '@minecraft/server';

export class ArrayDatabase<T = any> {
  public static readonly PROPERTY_MAX_SIZE = 12000;
  public static readonly PREFIX = 'array';

  private readonly cache: T[][] = [];
  private cacheLoaded = false;
  private currentKeyIndex = 0;

  constructor(public readonly id: string) {}

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

  public has(value: T) {
    const locations = this.getAll();
    return locations.includes(value);
  }

  public clear() {
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

  private trySave(values: T[], swap: T[] = []) {
    let sizeOK = true;
    const stringified = JSON.stringify(values);
    if (stringified.length > ArrayDatabase.PROPERTY_MAX_SIZE) {
      sizeOK = false;
    } else {
      try {
        world.setDynamicProperty(this.currentKey, stringified);
        this.cache[this.currentKeyIndex] = values;
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

  public get size(): number {
    return this.cache.reduce((acc, arr) => acc + arr.length, 0);
  }

   private load() {
    this.currentKeyIndex = world.getDynamicProperty(this.indexKey) as number ?? 0;
    const keys = world.getDynamicPropertyIds();
    const prefix = this.keyPrefix;
    for (const key of keys) {
      if (key.includes('_index')) console.warn(key)
      if (!key.startsWith(prefix)) continue;
      const index = Number(key.slice(prefix.length));
      if (Number.isNaN(index)) {
        console.error(`Found invalid key: ${key}`);
        continue;
      }
      this.cache[index] = JSON.parse(
        world.getDynamicProperty(key) as string ?? '[]'
      );
    }
    this.cacheLoaded = true;
  }

  private unload(): void {
    this.cache.length = 0;
    this.cacheLoaded = false;
    this.currentKeyIndex = 0;
  }

  private get keyPrefix(): string {
    return `${ArrayDatabase.PREFIX}:${this.id}` as string;
  }
  
  private get currentKey(): string {
    return `${this.keyPrefix}${this.currentKeyIndex}`;
  }

  private get indexKey(): string {
    return `${ArrayDatabase.PREFIX}:index_${this.id}` as string;
  }
  
  public get [Symbol.toStringTag](): string {
    return this.id;
  }
}
