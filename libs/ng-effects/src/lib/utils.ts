import { addDeps, createEffect, depsMap, getContext, getValues, inject, reactiveFactory, Ref, runWithDeps, targetSymbol } from "./connect"
import { LifecycleHook, OnInvalidate, StopHandle, Teardown } from "./interfaces"
import { getLifecycleHook } from "./lifecycle"
import { IterableDiffers } from "@angular/core"
import { PartialObserver, Subscribable } from "rxjs"
import { materialize, repeat } from "rxjs/operators"
import { ActionCreator, Effect } from "./effect"

export function context<T extends object>(): T {
    return getContext<T>()
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value)
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value, { shallow: true })
}

export interface WatchEffectOptions {
    flush?: "pre" | "post" | "sync"
}

export function watchEffect(
    effect: (onInvalidate: OnInvalidate) => Teardown,
    opts?: WatchEffectOptions,
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

export function observe<T extends object>(
    source: ActionCreator<any, T>,
    observer: PartialObserver<T>,
): StopHandle
export function observe<T>(
    source: Effect<T>,
    observer: PartialObserver<T>,
): StopHandle
export function observe<T>(
    source: Subscribable<T>,
    observer: (value: T) => void,
): StopHandle
export function observe<T>(
    source: Subscribable<T>,
    observer: PartialObserver<T>,
): StopHandle
export function observe(source: any, observer: any): StopHandle {
    source = "asObservable" in source ? source.asObservable() : source
    return effect(() => {
        return source instanceof Effect
            ? source
                  .pipe(materialize(), repeat())
                  .subscribe((notification: any) => {
                      notification.accept(observer)
                  })
            : source.subscribe(observer)
    })
}

type WatcherSource<T> = Ref<T> | (() => T)

type MapSources<T> = {
    [K in keyof T]: T[K] extends WatcherSource<infer V> ? V : never
}
// watching multiple sources
export function watch<T extends [WatcherSource<any>, ...WatcherSource<any>[]]>(
    sources: T,
    callback: (
        values: MapSources<T>,
        oldValues: MapSources<T>,
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle
// wacthing single source
export function watch<T>(
    source: WatcherSource<T>,
    callback: (value: T, oldValue: T, onInvalidate: OnInvalidate) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    sources: any,
    callback: any,
    options?: WatchEffectOptions,
): StopHandle {
    let previousValues: any[] = []
    return watchEffect((onInvalidate) => {
        sources = Array.isArray(sources) ? sources : [sources]
        const currentValues = []
        for (const source of sources) {
            currentValues.push(source())
        }
        onInvalidate(
            sources.length > 1
                ? callback(currentValues, previousValues, onInvalidate)
                : callback(currentValues[0], previousValues[0], onInvalidate),
        )
        previousValues = currentValues
    }, options)
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
    : unknown extends T
    ? (arg?: unknown) => void
    : (arg: T) => void
