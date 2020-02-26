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
    const keyStore = createIfNotExists(key, metadata, () => new Map())
    const targetStore = createIfNotExists(target, keyStore, () => new Map())
    if (propertyKey) {
        targetStore.set(propertyKey, value)
    } else {
        targetStore.set(defaultKey, value)
    }
}

export function getMetadata(key: any, target?: any, propertyKey?: PropertyKey) {
    const keyStore = metadata.get(key)
    if (keyStore && target) {
        const targetStore = keyStore.get(target)
        if (targetStore && propertyKey) {
            return targetStore.get(propertyKey)
        } else {
            return targetStore
        }
    } else {
        return keyStore
    }
}
