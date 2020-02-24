export function createIfNotExists<T, U>(
    key: any,
    map: T extends object ? WeakMap<T, U> : Map<T, U>,
    value: () => U,
): U {
    return map.get(key) || (map.set(key, value()).get(key) as any)
}

const metadata = new WeakMap<any, Map<any, any>>()
const defaultKey = {}

export function defineMetadata(key: any, value: any, target: any, propertyKey?: PropertyKey) {
    const targetStore = createIfNotExists(target, metadata, () => new Map())
    const keyStore = createIfNotExists(key, targetStore, () => new Map())
    if (propertyKey) {
        keyStore.set(propertyKey, value)
    } else {
        keyStore.set(defaultKey, value)
    }
}

export function getMetadata(key: any, target: any, propertyKey?: PropertyKey) {
    const targetStore = metadata.get(target)
    if (targetStore) {
        const keyStore = targetStore.get(key)
        if (keyStore) {
            return propertyKey ? keyStore.get(propertyKey) : keyStore.get(defaultKey)
        }
    }
}
