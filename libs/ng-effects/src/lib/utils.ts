import {
    collectDeps,
    createEffect,
    flushDeps,
    getContext,
    getValues,
    inject,
    reactiveFactory,
    targetSymbol,
} from "./connect"
import { TeardownLogic } from "rxjs"
import {
    LifecycleHook,
    OnInvalidate,
    StopHandler,
} from "./interfaces"
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
    effect: (onInvalidate: OnInvalidate) => TeardownLogic,
    opts?: {
        flush?: "pre" | "post" | "sync"
    },
): StopHandler {
    return createEffect(effect, {
        watch: true,
        flush: opts?.flush || "post",
    })
}

export function effect(
    effect: (onInvalidate: OnInvalidate) => TeardownLogic,
): StopHandler {
    return createEffect(effect)
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) !== undefined
}

export function isOnDestroy() {
    return getLifecycleHook() === LifecycleHook.OnDestroy
}

export const $: Computed = function computed<T extends (...args: any[]) => any>(fn: T) {
    const differs = inject(IterableDiffers)
    const differ = differs.find([]).create()
    let deps = new Map()
    let value: any

    function read(args: any[]) {
        collectDeps()
        value = fn(...args)
        deps = flushDeps()
    }

    function detectChanges(args: any[]) {
        return differ.diff(getValues(deps).concat(args))
    }

    return function compute(...args: any[]) {
        if (deps.size === 0) {
            read(args)
            detectChanges(args)
        } else if (detectChanges(args)) {
            read(args)
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
