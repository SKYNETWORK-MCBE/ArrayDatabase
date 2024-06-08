# ArrayDatabase
A database manager for storing unlimited array in ScriptAPI

## Usage
JavaScript
```js
/** @type {ArrayDatabase<string>} */
const db = new ArrayDatabase('test');

db.put('hello');
db.put('world');
db.get(); // ["hello", "world"]
db.has('hello'); // true
db.clear();
db.size; // 0
```

TypeScript
```ts
const db = new ArrayDatabase<Vector3>('test');

db.put({ x: 0, y: 0, z: 0 });
db.put({ x: 1, y: 1, z: 1 });
db.get(); // [{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }]
```

## Benchmark (put)
||x10|x100|
|-|-|-|
|string(100bytes)|0ms|6ms|
|vector3|1ms|34ms|
