import { world } from '@minecraft/server';
/**
 * T: The type of the value used in the database
 * U: (optional) The type of the value stored in the world
 */
export class ArrayDatabase {
    constructor(id, options = {}) {
        this.id = id;
        this.PROPERTY_MAX_SIZE = 12000;
        this.PREFIX = 'array';
        this.cache = [];
        this.cacheLoaded = false;
        this.currentKeyIndex = 0;
        if (options.PROPERTY_MAX_SIZE)
            this.PROPERTY_MAX_SIZE = options.PROPERTY_MAX_SIZE;
        if (options.PREFIX)
            this.PREFIX = options.PREFIX;
        if (options.transformer)
            this.transformer = options.transformer;
    }
    getAll() {
        if (!this.cacheLoaded)
            this.load();
        const result = [];
        for (const value of this.cache)
            result.push(...value);
        return result;
    }
    add(value) {
        if (!this.cacheLoaded)
            this.load();
        const baseData = this.cache[this.currentKeyIndex] ?? [];
        baseData.push(value);
        this.trySave(baseData);
        return this;
    }
    has(value) {
        const locations = this.getAll();
        return locations.includes(value);
    }
    clear() {
        const keys = world.getDynamicPropertyIds();
        const prefix = this.keyPrefix;
        for (const key of keys) {
            if (key.startsWith(prefix))
                world.setDynamicProperty(key);
        }
        this.currentKeyIndex = 0;
        world.setDynamicProperty(this.indexKey);
        this.cache.length = 0;
    }
    *values() {
        if (!this.cacheLoaded)
            this.load();
        for (const values of this.cache) {
            for (const value of values) {
                yield value;
            }
        }
    }
    find(callbackfn) {
        for (const value of this.values()) {
            if (callbackfn(value))
                return value;
        }
        return undefined;
    }
    filter(callbackfn) {
        const result = [];
        for (const value of this.values()) {
            if (callbackfn(value))
                result.push(value);
        }
        return result;
    }
    map(callbackfn) {
        const result = [];
        for (const value of this.values()) {
            result.push(callbackfn(value));
        }
        return result;
    }
    forEach(callbackfn) {
        for (const value of this.values()) {
            callbackfn(value);
        }
    }
    some(callbackfn) {
        for (const value of this.values()) {
            if (callbackfn(value))
                return true;
        }
        return false;
    }
    every(callbackfn) {
        for (const value of this.values()) {
            if (!callbackfn(value))
                return false;
        }
        return true;
    }
    [Symbol.iterator]() {
        return this.values();
    }
    get size() {
        return this.cache.reduce((acc, arr) => acc + arr.length, 0);
    }
    trySave(values, swap = [], index = this.currentKeyIndex) {
        let sizeOK = true;
        const stringified = JSON.stringify(this.transformer ? values.map(this.transformer.onWrite) : values);
        if (stringified.length > this.PROPERTY_MAX_SIZE) {
            sizeOK = false;
        }
        else {
            try {
                world.setDynamicProperty(`${this.keyPrefix}${index}`, stringified);
                this.cache[index] = values;
            }
            catch (e) {
                sizeOK = false;
            }
        }
        if (!sizeOK) {
            if (values.length > 0)
                swap.push(values.shift());
            this.trySave(values, swap);
            this.currentKeyIndex++;
            world.setDynamicProperty(this.indexKey, this.currentKeyIndex);
            this.trySave(swap);
        }
    }
    load() {
        this.currentKeyIndex = world.getDynamicProperty(this.indexKey) ?? 0;
        const keys = world.getDynamicPropertyIds();
        const prefix = this.keyPrefix;
        for (const key of keys) {
            if (!key.startsWith(prefix))
                continue;
            const index = Number(key.slice(prefix.length));
            if (Number.isNaN(index)) {
                console.error(`[ArrayDatabase:${this.id}] Found invalid key: ${key}`);
                continue;
            }
            const parsed = JSON.parse(world.getDynamicProperty(key) ?? '[]');
            this.cache[index] = this.transformer ? parsed.map(this.transformer.onRead) : parsed;
        }
        this.cacheLoaded = true;
    }
    unload() {
        this.cache.length = 0;
        this.cacheLoaded = false;
        this.currentKeyIndex = 0;
    }
    get keyPrefix() {
        return `${this.PREFIX}:${this.id}`;
    }
    get indexKey() {
        return `${this.PREFIX}:index_${this.id}`;
    }
    get [Symbol.toStringTag]() {
        return this.id;
    }
}
