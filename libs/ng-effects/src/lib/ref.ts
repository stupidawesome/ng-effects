import { TrackOpTypes, TriggerOpTypes } from "./operations"
import { reactive, shallowReactive } from "./reactive"
import { getActiveEffect, watchEffect } from "./effect"
import { LinkedList } from "./utils"

const RefSymbol: unique symbol = Symbol("RefSymbol")

export class Ref<T> {
    readonly [RefSymbol] = true
    public value: T
    constructor(value?: T, shallow = false) {
        this.value = unref(value) as T
        return shallow ? shallowReactive(this) : (reactive(this) as any)
    }
}

type ReadonlyRef<T> = Readonly<Ref<Readonly<T>>>

export function shallowRef<T>(): Ref<T | undefined>
export function shallowRef<T extends Ref<any>>(value: T): Ref<UnwrapRefs<T>>
export function shallowRef<T>(value: T): Ref<T>
export function shallowRef(value?: unknown): Ref<unknown> {
    return new Ref(value, true)
}

export function ref<T>(): Ref<T | undefined>
export function ref<T extends Ref<any>>(value: T): Ref<UnwrapRef<T>>
export function ref<T>(value: T): Ref<T>
export function ref(value?: unknown): Ref<unknown> {
    return new Ref(value)
}

export function isRef(value: any): value is Ref<any> {
    return value instanceof Ref
}

export function unref<T>(ref: Ref<T> | T): T {
    return isRef(ref) ? ref.value : ref
}

export function toRef<T extends object, U extends keyof T>(
    obj: T,
    key: U,
): Ref<T[U]> {
    return customRef((track, trigger) => {
        return {
            get() {
                track()
                return obj[key]
            },
            set(val) {
                obj[key] = val
                trigger()
            },
        }
    })
}

export type RefMap<T> = {
    [key in keyof T]: Ref<T[key]>
}

export function toRefs<T extends object>(obj: T): RefMap<T> {
    const map: any = {}
    for (const key of Object.keys(obj) as any[]) {
        map[key] = toRef(unref(obj), key)
    }
    return map
}

export function track(target: any, op: any, key: unknown) {
    const effect = getActiveEffect()
    if (effect) {
        getDeps().set(target, key, effect)
    }
}
const deps = new LinkedList<object, unknown, () => void>()

export function getDeps() {
    return deps
}

export function trigger(
    target: any,
    op: any,
    key: unknown,
    value?: any,
    prevValue?: any,
) {
    const invalidations = deps.get(target, key)
    // copy current deps so we don't invalidate new `sync` effects
    const copy = new Set(invalidations)
    if (invalidations) {
        invalidations.clear()
        for (const invalidate of copy) {
            invalidate()
        }
    }
}

export function computed<T>(options: {
    get: () => T
    set: (val: T) => void
}): Ref<T>
export function computed<T>(getter: () => T): ReadonlyRef<T>
export function computed(getterOrOptions: any): Ref<any> {
    let value: any
    let dirty = true

    const ref = customRef((track, trigger) => {
        const watchFn =
            typeof getterOrOptions === "function" ? useGetter : useOptions

        function readValue() {
            dirty = false
            const stop = watchEffect(
                (onInvalidate) => {
                    watchFn()
                    onInvalidate(() => {
                        dirty = true
                        stop()
                        trigger()
                    })
                },
                { flush: "sync" },
            )
        }

        function useGetter() {
            value = getterOrOptions()
            trigger()
        }

        function useOptions() {
            value = getterOrOptions.get()
            trigger()
        }

        return {
            get: () => {
                if (dirty) {
                    readValue()
                }
                track()
                return value
            },
            set: (val) => {
                if (typeof getterOrOptions !== "function") {
                    getterOrOptions.set(val)
                } else {
                    throw new Error("Cannot set readonly value")
                }
                trigger()
            },
        }
    })

    return ref
}

type CustomRefFactory<T> = (
    track: () => void,
    trigger: () => void,
) => {
    get: () => T
    set: (value: T) => void
}

export function customRef<T>(factory: CustomRefFactory<T>): Ref<T> {
    const ref = Object.create(Ref.prototype, {
        [RefSymbol]: {
            value: true,
        },
        value: factory(trackRef, triggerRef),
    })
    function trackRef() {
        track(ref, TrackOpTypes.GET, "value")
    }
    function triggerRef() {
        trigger(ref, TriggerOpTypes.SET, "value")
    }
    return ref
}

export type UnwrapRef<T> = T extends Ref<infer R> ? R : UnwrapRefs<T>

export type UnwrapRefs<T extends unknown> = T extends Function
    ? T
    : {
          [key in keyof T]: UnwrapRef<T[key]>
      }
