import { world } from '@minecraft/server';
export class ArrayDatabase {
    constructor(id) {
        this.id = id;
        this.cache = [];
        this.cacheLoaded = false;
        this.currentKeyIndex = 0;
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
    trySave(values, swap = []) {
        let sizeOK = true;
        const stringified = JSON.stringify(values);
        if (stringified.length > ArrayDatabase.PROPERTY_MAX_SIZE) {
            sizeOK = false;
        }
        else {
            try {
                world.setDynamicProperty(this.currentKey, stringified);
                this.cache[this.currentKeyIndex] = values;
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
                console.error(`Found invalid key: ${key}`);
                continue;
            }
            this.cache[index] = JSON.parse(world.getDynamicProperty(key) ?? '[]');
        }
        this.cacheLoaded = true;
    }
    unload() {
        this.cache.length = 0;
        this.cacheLoaded = false;
        this.currentKeyIndex = 0;
    }
    get keyPrefix() {
        return `${ArrayDatabase.PREFIX}:${this.id}`;
    }
    get currentKey() {
        return `${this.keyPrefix}${this.currentKeyIndex}`;
    }
    get indexKey() {
        return `${ArrayDatabase.PREFIX}:index_${this.id}`;
    }
    get [Symbol.toStringTag]() {
        return this.id;
    }
}
ArrayDatabase.PROPERTY_MAX_SIZE = 12000;
ArrayDatabase.PREFIX = 'array';
