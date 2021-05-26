/* 2.1 */

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}


export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    const database = new Map();
    return {
        get(key: K) {
            return new Promise<V>((resolve, reject) => {
                const shit = database.get(key);
                if (shit === undefined) {
                    reject(MISSING_KEY);
                }
                else {
                    resolve(shit);
                }
            })
        },
        set(key: K, value: V) {
            return new Promise<void>((resolve, reject) => {
                database.set(key, value);
                resolve();
            })
        },
        delete(key: K) {
            return new Promise<void>((resolve, reject) => {
                const shit = database.get(key);
                if (shit === undefined) {
                    reject(MISSING_KEY);
                }
                else {
                    database.delete(key);
                    resolve();
                }
            })
        },
    }
}

export function getAll<K, V>(store: PromisedStore<K, V>, keys: K[]): Promise<V[]> {

    return new Promise<V[]>((resolve, reject) =>
        Promise.all(keys.map((key) => { return store.get(key) })).then((v) => resolve(v)).catch(err => reject(MISSING_KEY))
    )
}

/* 2.2 */

export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store = makePromisedStore<T, R>();
    return async (param) => {
        try {
            const get = await store.get(param);
            return get;
        }
        catch {
            const result = f(param);
            store.set(param, result);
            return result;
        }
    }
}

/* 2.3 */

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (param: T) => boolean): () => Generator<T> {
    const f = genFn();
    return function* () {
        for (let x of f) {
            if (filterFn(x)) yield x;
        }
        return;
    }
}

export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (param: T) => R): () => Generator<R> {
    const f = genFn();
    return function* () {
        for (let x of f) {
            yield mapFn(x);
        }
        return;
    }
}

/* 2.4 */
// you can use 'any' in this question

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((param:any)=>any)[]] ): Promise<any> {
    return async () => {
        let res: any = undefined;
        for (let f of fns) {
            try {
                res = await f(res);

            } catch {
                return await new Promise((resolve) => {
                    setTimeout(() => resolve(f(res)), 1000);
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            try { resolve(f(res)) }
                            catch { reject("Failed in function:" + f) }
                        }, 1000);
                    })
                })

            }
        }
        return res;
        
    }
}