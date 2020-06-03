// Modified from https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/reactive.ts

import {
    mutableCollectionHandlers,
    readonlyCollectionHandlers,
    shallowCollectionHandlers,
} from "./collection-handlers"
import { isDevMode } from "@angular/core"
import { def, hasOwn, isObject, makeMap, toRawType } from "./utils"
import { ReactiveFlags, Target, UnwrapNestedRefs } from "./interfaces"
import {
    mutableHandlers,
    readonlyHandlers,
    shallowReactiveHandlers,
    shallowReadonlyHandlers,
} from "./base-handlers"

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
