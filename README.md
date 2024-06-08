# ArrayDatabase
A database manager for storing unlimited array in ScriptAPI  
Compatible with `@minecraft/server@1.10.0+`

## Usage
JavaScript
```js
/** @type {ArrayDatabase<string>} */
const db = new ArrayDatabase('test');

db.put('hello');
db.put('world');
db.getAll(); // ["hello", "world"]
db.has('hello'); // true
db.clear();
db.size; // 0
```

TypeScript
```ts
const db = new ArrayDatabase<Vector3>('test');

db.put({ x: 0, y: 0, z: 0 });
db.put({ x: 1, y: 1, z: 1 });
db.getAll(); // [{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }]
```

## Method/Properties
- (template) `T`
- `readonly id: string`
- `get size(): number`
- `getAll(): T[]`
- `add(value: T): this`
- `has(value: T): boolean`
- `clear(): void`
- `*values(): IterableIterator<T>`
- `find(callbackfn: (value: T) => boolean): T | undefined`
- `filter(callbackfn: (value: T) => boolean): T[]`
- `map<U>(callbackfn: (value: T) => U): U[]`
- `forEach(callbackfn: (value: T) => void): void`
- `some(callbackfn: (value: T) => boolean): boolean`
- `every(callbackfn: (value: T) => boolean): boolean`
- `[Symbol.iterator](): IterableIterator<T>`

## Benchmark (put)
||x10|x100|
|-|-|-|
|string(100bytes)|0ms|6ms|
|vector3|1ms|34ms|
