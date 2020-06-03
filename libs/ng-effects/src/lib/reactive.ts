// Modified from https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/reactive.ts

import { isDevMode } from "@angular/core"
import { def, hasChanged, hasOwn, isArray, isObject, isSymbol, ITERATE_KEY, makeMap, MAP_KEY_ITERATE_KEY, toRaw, toRawType } from "./utils"
import { ReactiveFlags, Target, UnwrapNestedRefs } from "./interfaces"
import { isRef, track, trigger } from "./ref"
import { TrackOpTypes, TriggerOpTypes } from "./operations"

// BASE HANDLERS

const builtInSymbols = new Set(
    Object.getOwnPropertyNames(Symbol)
        .map((key) => (Symbol as any)[key])
        .filter(isSymbol),
)

const get = /*#__PURE__*/ createGetter()
const shallowGet = /*#__PURE__*/ createGetter(false, true)
const readonlyGet = /*#__PURE__*/ createGetter(true)
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true)

const arrayInstrumentations: Record<string, Function> = {}
;["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    arrayInstrumentations[key] = function (...args: any[]): any {
        const arr = toRaw(this) as any
        for (let i = 0, l = (this as any).length; i < l; i++) {
            track(arr, TrackOpTypes.GET, i + "")
        }
        // we run the method using the original args first (which may be reactive)
        const res = arr[key](...args)
        if (res === -1 || res === false) {
            // if that didn't work, run it again using raw values.
            return arr[key](...args.map(toRaw))
        } else {
            return res
        }
    }
})

function createGetter(isReadonly = false, shallow = false) {
    return function get(
        target: object,
        key: string | symbol,
        receiver: object,
    ) {
        if (key === ReactiveFlags.isReactive) {
            return !isReadonly
        } else if (key === ReactiveFlags.isReadonly) {
            return isReadonly
        } else if (key === ReactiveFlags.raw) {
            return target
        }

        const targetIsArray = isArray(target)
        if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver)
        }
        const res = Reflect.get(target, key, receiver)

        if ((isSymbol(key) && builtInSymbols.has(key)) || key === "__proto__") {
            return res
        }

        if (shallow) {
            !isReadonly && track(target, TrackOpTypes.GET, key)
            return res
        }

        if (isRef(res)) {
            if (targetIsArray) {
                !isReadonly && track(target, TrackOpTypes.GET, key)
                return res
            } else {
                // ref unwrapping, only for Objects, not for Arrays.
                return res.value
            }
        }

        !isReadonly && track(target, TrackOpTypes.GET, key)
        return isObject(res)
            ? isReadonly
                ? // need to lazy access readonly and reactive here to avoid
                  // circular dependency
                readonly(res)
                : reactive(res)
            : res
    }
}

const set = /*#__PURE__*/ createSetter()
const shallowSet = /*#__PURE__*/ createSetter(true)

function createSetter(shallow = false) {
    return function set(
        target: object,
        key: string | symbol,
        value: unknown,
        receiver: object,
    ): boolean {
        const oldValue = (target as any)[key]
        if (!shallow) {
            value = toRaw(value)
            if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                oldValue.value = value
                return true
            }
        } else {
            // in shallow mode, objects are set as-is regardless of reactive or not
        }

        const hadKey = hasOwn(target, key)
        const result = Reflect.set(target, key, value, receiver)
        // don't trigger if target is something up in the prototype chain of original
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, TriggerOpTypes.ADD, key, value)
            } else if (hasChanged(value, oldValue)) {
                trigger(target, TriggerOpTypes.SET, key, value, oldValue)
            }
        }
        return result
    }
}

function deleteProperty(target: object, key: string | symbol): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
}

function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key)
    track(target, TrackOpTypes.HAS, key)
    return result
}

function ownKeys(target: object): (string | number | symbol)[] {
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    return Reflect.ownKeys(target)
}

export const mutableHandlers: ProxyHandler<object> = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys,
}

export const readonlyHandlers: ProxyHandler<object> = {
    get: readonlyGet,
    has,
    ownKeys,
    set(target, key) {
        if (isDevMode()) {
            console.warn(
                `Set operation on key "${String(
                    key,
                )}" failed: target is readonly.`,
                target,
            )
        }
        return true
    },
    deleteProperty(target, key) {
        if (isDevMode()) {
            console.warn(
                `Delete operation on key "${String(
                    key,
                )}" failed: target is readonly.`,
                target,
            )
        }
        return true
    },
}

export const shallowReactiveHandlers: ProxyHandler<object> = {
    ...mutableHandlers,
    get: shallowGet,
    set: shallowSet,
}

// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
export const shallowReadonlyHandlers: ProxyHandler<object> = {
    ...readonlyHandlers,
    get: shallowReadonlyGet,
}

// COLLECTION HANDLERS

export type CollectionTypes = IterableCollections | WeakCollections

type IterableCollections = Map<any, any> | Set<any>
type WeakCollections = WeakMap<any, any> | WeakSet<any>
type MapTypes = Map<any, any> | WeakMap<any, any>
type SetTypes = Set<any> | WeakSet<any>

const toReactive = <T extends unknown>(value: T): T =>
    (isObject(value) ? reactive(value) : value) as T

const toReadonly = <T extends unknown>(value: T): T =>
    (isObject(value) ? readonly(value) : value) as T

const toShallow = <T extends unknown>(value: T): T => value

const getProto = <T extends CollectionTypes>(v: T): any =>
    Reflect.getPrototypeOf(v)

function _get(
    target: MapTypes,
    key: unknown,
    wrap: typeof toReactive | typeof toReadonly | typeof toShallow,
) {
    target = toRaw(target)
    const rawKey = toRaw(key)
    if (key !== rawKey) {
        track(target, TrackOpTypes.GET, key)
    }
    track(target, TrackOpTypes.GET, rawKey)
    const { has, get } = getProto(target)
    if (has.call(target, key)) {
        return wrap(get.call(target, key))
    } else if (has.call(target, rawKey)) {
        return wrap(get.call(target, rawKey))
    }
}

function _has(this: CollectionTypes, key: unknown): boolean {
    const target = toRaw(this)
    const rawKey = toRaw(key)
    if (key !== rawKey) {
        track(target, TrackOpTypes.HAS, key)
    }
    track(target, TrackOpTypes.HAS, rawKey)
    const has = getProto(target).has
    return has.call(target, key) || has.call(target, rawKey)
}

function size(target: IterableCollections) {
    target = toRaw(target)
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    return Reflect.get(getProto(target), "size", target)
}

function add(this: SetTypes, value: unknown) {
    value = toRaw(value)
    const target = toRaw(this)
    const proto = getProto(target)
    const hadKey = proto.has.call(target, value)
    const result = proto.add.call(target, value)
    if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, value, value)
    }
    return result
}

function _set(this: MapTypes, key: unknown, value: unknown) {
    value = toRaw(value)
    const target = toRaw(this)
    const { has, get, set } = getProto(target)

    let hadKey = has.call(target, key)
    if (!hadKey) {
        key = toRaw(key)
        hadKey = has.call(target, key)
    } else if (isDevMode()) {
        checkIdentityKeys(target, has, key)
    }

    const oldValue = get.call(target, key)
    const result = set.call(target, key, value)
    if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
    }
    return result
}

function deleteEntry(this: CollectionTypes, key: unknown) {
    const target = toRaw(this)
    const { has, get, delete: del } = getProto(target)
    let hadKey = has.call(target, key)
    if (!hadKey) {
        key = toRaw(key)
        hadKey = has.call(target, key)
    } else if (isDevMode()) {
        checkIdentityKeys(target, has, key)
    }

    const oldValue = get ? get.call(target, key) : undefined
    // forward the operation before queueing reactions
    const result = del.call(target, key)
    if (hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
}

function clear(this: IterableCollections) {
    const target = toRaw(this)
    const hadItems = target.size !== 0
    const oldTarget = isDevMode()
        ? target instanceof Map
            ? new Map(target)
            : new Set(target)
        : undefined
    // forward the operation before queueing reactions
    const result = getProto(target).clear.call(target)
    if (hadItems) {
        trigger(target, TriggerOpTypes.CLEAR, undefined, undefined, oldTarget)
    }
    return result
}

function createForEach(isReadonly: boolean, shallow: boolean) {
    return function forEach(
        this: IterableCollections,
        callback: Function,
        thisArg?: unknown,
    ) {
        const observed = this
        const target = toRaw(observed)
        const wrap = isReadonly ? toReadonly : shallow ? toShallow : toReactive
        !isReadonly && track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
        // important: create sure the callback is
        // 1. invoked with the reactive map as `this` and 3rd arg
        // 2. the value received should be a corresponding reactive/readonly.
        function wrappedCallback(value: unknown, key: unknown) {
            return callback.call(thisArg, wrap(value), wrap(key), observed)
        }
        return getProto(target).forEach.call(target, wrappedCallback)
    }
}

function createIterableMethod(
    method: string | symbol,
    isReadonly: boolean,
    shallow: boolean,
) {
    return function (this: IterableCollections, ...args: unknown[]) {
        const target = toRaw(this)
        const isMap = target instanceof Map
        const isPair =
            method === "entries" || (method === Symbol.iterator && isMap)
        const isKeyOnly = method === "keys" && isMap
        const innerIterator = getProto(target)[method].apply(target, args)
        const wrap = isReadonly ? toReadonly : shallow ? toShallow : toReactive
        !isReadonly &&
        track(
            target,
            TrackOpTypes.ITERATE,
            isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY,
        )
        // return a wrapped iterator which returns observed versions of the
        // values emitted from the real iterator
        return {
            // iterator protocol
            next() {
                const { value, done } = innerIterator.next()
                return done
                    ? { value, done }
                    : {
                        value: isPair
                            ? [wrap(value[0]), wrap(value[1])]
                            : wrap(value),
                        done,
                    }
            },
            // iterable protocol
            [Symbol.iterator]() {
                return this
            },
        }
    }
}

function createReadonlyMethod(type: TriggerOpTypes): Function {
    return function (this: CollectionTypes, ...args: unknown[]) {
        if (isDevMode()) {
            const key = args[0] ? `on key "${args[0]}" ` : ``
            console.warn(
                `${type} operation ${key}failed: target is readonly.`,
                toRaw(this),
            )
        }
        return type === TriggerOpTypes.DELETE ? false : this
    }
}

const mutableInstrumentations: Record<string, Function> = {
    get(this: MapTypes, key: unknown) {
        return _get(this, key, toReactive)
    },
    get size() {
        return size((this as unknown) as IterableCollections)
    },
    has: _has,
    add,
    set: _set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false),
}

const shallowInstrumentations: Record<string, Function> = {
    get(this: MapTypes, key: unknown) {
        return _get(this, key, toShallow)
    },
    get size() {
        return size((this as unknown) as IterableCollections)
    },
    has: _has,
    add,
    set: _set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true),
}

const readonlyInstrumentations: Record<string, Function> = {
    get(this: MapTypes, key: unknown) {
        return _get(this, key, toReadonly)
    },
    get size() {
        return size((this as unknown) as IterableCollections)
    },
    has: _has,
    add: createReadonlyMethod(TriggerOpTypes.ADD),
    set: createReadonlyMethod(TriggerOpTypes.SET),
    delete: createReadonlyMethod(TriggerOpTypes.DELETE),
    clear: createReadonlyMethod(TriggerOpTypes.CLEAR),
    forEach: createForEach(true, false),
}

const iteratorMethods = ["keys", "values", "entries", Symbol.iterator]
iteratorMethods.forEach((method) => {
    mutableInstrumentations[method as string] = createIterableMethod(
        method,
        false,
        false,
    )
    readonlyInstrumentations[method as string] = createIterableMethod(
        method,
        true,
        false,
    )
    shallowInstrumentations[method as string] = createIterableMethod(
        method,
        true,
        true,
    )
})

function createInstrumentationGetter(isReadonly: boolean, shallow: boolean) {
    const instrumentations = shallow
        ? shallowInstrumentations
        : isReadonly
            ? readonlyInstrumentations
            : mutableInstrumentations

    return (
        target: CollectionTypes,
        key: string | symbol,
        receiver: CollectionTypes,
    ) => {
        if (key === ReactiveFlags.isReactive) {
            return !isReadonly
        } else if (key === ReactiveFlags.isReadonly) {
            return isReadonly
        } else if (key === ReactiveFlags.raw) {
            return target
        }

        return Reflect.get(
            hasOwn(instrumentations, key) && key in target
                ? instrumentations
                : target,
            key,
            receiver,
        )
    }
}

export const mutableCollectionHandlers: ProxyHandler<CollectionTypes> = {
    get: createInstrumentationGetter(false, false),
}

export const shallowCollectionHandlers: ProxyHandler<CollectionTypes> = {
    get: createInstrumentationGetter(false, true),
}

export const readonlyCollectionHandlers: ProxyHandler<CollectionTypes> = {
    get: createInstrumentationGetter(true, false),
}

function checkIdentityKeys(
    target: CollectionTypes,
    has: (key: unknown) => boolean,
    key: unknown,
) {
    const rawKey = toRaw(key)
    if (rawKey !== key && has.call(target, rawKey)) {
        const type = toRawType(target)
        console.warn(
            `Reactive ${type} contains both the raw and reactive ` +
            `versions of the same object${
                type === `Map` ? `as keys` : ``
            }, ` +
            `which can lead to inconsistencies. ` +
            `Avoid differentiating between the raw and reactive versions ` +
            `of an object and only use the reactive version if possible.`,
        )
    }
}

// REACTIVE FACTORY

const collectionTypes = new Set<Function>([Set, Map, WeakMap, WeakSet])
const isObservableType = makeMap("Object,Array,Map,Set,WeakMap,WeakSet")

const canObserve = (value: Target): boolean => {
    return (
        !value.__ng_skip &&
        isObservableType(toRawType(value)) &&
        !Object.isFrozen(value)
    )
}

export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
export function reactive(target: object) {
    // if trying to observe a readonly proxy, return the readonly version.
    if (target && (target as Target).__ng_isReadonly) {
        return target
    }
    return createReactiveObject(
        target,
        false,
        mutableHandlers,
        mutableCollectionHandlers,
    )
}

// Return a reactive-copy of the original object, where only the root level
// properties are reactive, and does NOT unwrap refs nor recursively convert
// returned properties.
export function shallowReactive<T extends object>(target: T): T {
    return createReactiveObject(
        target,
        false,
        shallowReactiveHandlers,
        shallowCollectionHandlers,
    )
}

export function readonly<T extends object>(
    target: T,
): Readonly<UnwrapNestedRefs<T>> {
    return createReactiveObject(
        target,
        true,
        readonlyHandlers,
        readonlyCollectionHandlers,
    )
}

// Return a reactive-copy of the original object, where only the root level
// properties are readonly, and does NOT unwrap refs nor recursively convert
// returned properties.
// This is used for creating the props proxy object for stateful components.
export function shallowReadonly<T extends object>(
    target: T,
): Readonly<{ [K in keyof T]: UnwrapNestedRefs<T[K]> }> {
    return createReactiveObject(
        target,
        true,
        shallowReadonlyHandlers,
        readonlyCollectionHandlers,
    )
}

function createReactiveObject(
    target: Target,
    isReadonly: boolean,
    baseHandlers: ProxyHandler<any>,
    collectionHandlers: ProxyHandler<any>,
) {
    if (!isObject(target)) {
        if (isDevMode()) {
            console.warn(`value cannot be made reactive: ${String(target)}`)
        }
        return target
    }
    // target is already a Proxy, return it.
    // exception: calling readonly() on a reactive object
    if (target.__ng_raw && !(isReadonly && target.__ng_isReactive)) {
        return target
    }
    // target already has corresponding Proxy
    if (
        hasOwn(
            target,
            isReadonly ? ReactiveFlags.readonly : ReactiveFlags.reactive,
        )
    ) {
        return isReadonly ? target.__ng_readonly : target.__ng_reactive
    }
    // only a whitelist of value types can be observed.
    if (!canObserve(target)) {
        return target
    }
    const observed = new Proxy(
        target,
        collectionTypes.has(target.constructor)
            ? collectionHandlers
            : baseHandlers,
    )
    def(
        target,
        isReadonly ? ReactiveFlags.readonly : ReactiveFlags.reactive,
        observed,
    )
    return observed
}
