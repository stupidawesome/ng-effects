// modified from @vue/shared and @vue/reactivity

import { isDevMode } from "@angular/core"
import { ReactiveFlags, Target } from "./interfaces"

export const def = (obj: object, key: string | symbol, value: any) => {
    Object.defineProperty(obj, key, {
        configurable: true,
        value,
    })
}

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
    objectToString.call(value)

export const toRawType = (value: unknown): string => {
    return toTypeString(value).slice(8, -1)
}

export function makeMap(
    str: string,
    expectsLowerCase?: boolean,
): (key: string) => boolean {
    const map: Record<string, boolean> = Object.create(null)
    const list: Array<string> = str.split(",")
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    // noinspection PointlessBooleanExpressionJS
    return expectsLowerCase
        ? (val) => !!map[val.toLowerCase()]
        : (val) => !!map[val]
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const ITERATE_KEY = Symbol(isDevMode() ? "iterate" : "")
export const MAP_KEY_ITERATE_KEY = Symbol(isDevMode() ? "Map key iterate" : "")
export const isSymbol = (val: unknown): val is symbol => typeof val === "symbol"

export function isObject(value: any): value is object {
    return typeof value === "object" && value !== null
}

export class LinkedList<T extends object, U, V> {
    private list = new WeakMap<T, Map<U, Set<V>>>()
    set(key1: T, key2: U, value: V) {
        const first = this.list
        const second = first.get(key1) ?? first.set(key1, new Map()).get(key1)!
        const third = second.get(key2) ?? second.set(key2, new Set()).get(key2)!

        third.add(value)
    }
    get(key1: T, key2: U) {
        return this.list.get(key1)?.get(key2)
    }

    delete(key1: T, key2: U) {
        const set = this.list.get(key1)?.get(key2)
        if (set) {
            set.clear()
        }
    }
}
export function isReactive(value: unknown): boolean {
    if (isReadonly(value)) {
        return isReactive((value as Target).__ng_raw)
    }
    return !!(value && (value as Target).__ng_isReactive)
}

export function isReadonly(value: unknown): boolean {
    return !!(value && (value as Target).__ng_isReadonly)
}

export function isProxy(value: unknown): boolean {
    return isReactive(value) || isReadonly(value)
}

export function toRaw<T>(observed: T): T {
    return (observed && toRaw((observed as Target).__ng_raw)) || observed
}

export function markRaw<T extends object>(value: T): T {
    def(value, ReactiveFlags.skip, true)
    return value
}

export const isArray = Array.isArray

// compare whether a value has changed, accounting for NaN.
export const hasChanged = (value: any, oldValue: any): boolean =>
    value !== oldValue && (value === value || oldValue === oldValue)
