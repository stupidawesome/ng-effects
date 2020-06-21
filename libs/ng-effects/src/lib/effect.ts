import { Ref, UnwrapRef } from "./ref"
import {
    CreateEffect,
    Lifecycle,
    OnInvalidate,
    WatchEffectOptions,
} from "./interfaces"
import {
    changeDectorRefs,
    getContext,
    getPhase,
    isRootContext,
    runInContext,
} from "./ngfx"
import { getInvalidated, getInvalidators } from "./invalidate"
import { onDestroy, runHook } from "./lifecycle"

export type StopHandle = () => void

let activeEffect: (() => void) | undefined

export function getActiveEffect() {
    return activeEffect
}

export function flush(timing: "pre" | "post" | "sync") {
    const context = getContext()
    const list = getInvalidated().get(context, timing)
    if (list) {
        for (const restart of list) {
            restart()
        }
        list.clear()
    }
}

function createInvalidator(
    factory: CreateEffect,
    options: WatchEffectOptions,
    context: any,
    phase?: number,
): [(force?: boolean) => void, OnInvalidate] {
    let running = true
    const teardowns = new Set<() => void>()
    const invalidators = getInvalidators()
    const flush = isRootContext(context) ? "sync" : options.flush ?? "post"
    const cdr = changeDectorRefs.get(context)

    onDestroy(() => stop(true))

    function restart() {
        if (running) {
            runEffect(factory, onInvalidate, stop)
        }
        return running
    }

    function onInvalidate(teardown: () => void): void {
        teardowns.add(teardown)
    }

    function stop(done = false) {
        const currentPhase = getPhase()
        const invalidated = getInvalidated()
        const list = new Set(teardowns)
        teardowns.clear()
        for (const teardown of list) {
            teardown()
        }
        if (running) {
            if (done) {
                running = false
                invalidated.delete(context, flush)
                return
            }
            if (cdr) {
                cdr.markForCheck()
            }
            if (flush === "sync") {
                restart()
            } else {
                invalidated.set(context, flush, restart)
            }
            if (currentPhase === undefined) {
                runInContext(context, Lifecycle.OnCheck, runHook)
            }
        }
    }

    invalidators.set(context, phase, stop)

    return [stop, onInvalidate]
}

function runEffect(
    factory: CreateEffect,
    onInvalidate: OnInvalidate,
    stop: () => void,
) {
    const previous = activeEffect
    activeEffect = stop
    factory(onInvalidate)
    activeEffect = previous
}

export function createEffect(
    factory: CreateEffect,
    options: WatchEffectOptions = {},
): StopHandle {
    const context = getContext()
    const phase = getPhase()
    const [stop, onInvalidate] = createInvalidator(
        factory,
        options,
        context,
        phase,
    )
    runEffect(factory, onInvalidate, stop)
    return function stopHandler() {
        stop(true)
    }
}

export function watchEffect(
    factory: CreateEffect,
    options?: WatchEffectOptions,
) {
    return createEffect(factory, options)
}

export function readValues(source: any, isArray: boolean) {
    return isArray ? source.map(readValue) : readValue(source)
}

export function readValue(ref: any) {
    return typeof ref === "function" ? ref() : ref.value
}

export function compareValues(curr: any, prev: any, checkArray: boolean) {
    if (checkArray) {
        return curr.every((item: any, i: number) => item === prev[i])
    }
    return curr === prev
}

export type WatchSource<T> = Ref<T> | (() => T)

export type WatchValues<T> = {
    [key in keyof T]: T[key] extends () => infer R ? R : UnwrapRef<T[key]>
}

export function watch<T extends [WatchSource<any>, ...WatchSource<any>[]]>(
    source: T,
    observer: (
        value: WatchValues<T>,
        previousValue: WatchValues<T>,
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: WatchSource<T>,
    observer: (value: T, previousValue: T, onInvalidate: OnInvalidate) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: WatchSource<T> | WatchSource<T>[],
    observer: (
        value: T | T[],
        previousValue: T | T[],
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle {
    const isArray = Array.isArray(source)
    let first = options?.immediate ?? false
    let stopped = false
    let stop
    let previousValue = readValues(source, isArray)
    onDestroy(() => (stopped = true))

    stop = watchEffect((onInvalidate) => {
        const value = readValues(source, isArray)
        if (stopped || (compareValues(value, previousValue, isArray) && !first))
            return
        observer(value, previousValue, onInvalidate)
        previousValue = value
    }, options)

    first = false

    return stop
}
