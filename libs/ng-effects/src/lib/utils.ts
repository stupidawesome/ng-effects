import {
    addDeps,
    createEffect,
    depsMap,
    getContext,
    getValues,
    inject,
    reactiveFactory,
    runWithDeps,
    targetSymbol,
} from "./connect"
import { LifecycleHook, OnInvalidate, StopHandle, Teardown } from "./interfaces"
import { getLifecycleHook } from "./lifecycle"
import { IterableDiffers } from "@angular/core"

export function context<T extends object>(): T {
    return getContext<T>()
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value)
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value, { shallow: true })
}

export function watchEffect(
    effect: (onInvalidate: OnInvalidate) => Teardown,
    opts?: {
        flush?: "pre" | "post" | "sync"
    },
): StopHandle {
    return createEffect(effect, {
        watch: true,
        flush: opts?.flush || "post",
    })
}

export function effect(
    effect: (onInvalidate: OnInvalidate) => Teardown,
): StopHandle {
    return createEffect(effect)
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) !== undefined
}

export function isOnDestroy() {
    return getLifecycleHook() === LifecycleHook.OnDestroy
}

export const $: Computed = function computed<T extends (...args: any[]) => any>(
    fn: T,
) {
    const differs = inject(IterableDiffers)
    const differ = differs.find([]).create()
    let deps: typeof depsMap
    let value: any

    function read(args: any[]) {
        ;[deps, value] = runWithDeps(() => fn(...args))
    }

    function detectChanges(args: any[]) {
        return differ.diff(getValues(deps).concat(args))
    }

    return function compute(...args: any[]) {
        if (!deps) {
            read(args)
            detectChanges(args)
        } else if (detectChanges(args)) {
            read(args)
        }
        for (const [key, val] of deps) {
            for (const dep of val) {
                addDeps(key, dep)
            }
        }
        return value
    }
} as Computed

export interface Computed {
    new <T extends (...args: any[]) => any>(fn: T): T
    <T extends (...args: any[]) => any>(fn: T): T
}

export const Computed = $

export type NextFn<T> = T extends void
    ? () => void
    : T extends any[]
    ? (...args: T) => void
    : (arg: T) => void
