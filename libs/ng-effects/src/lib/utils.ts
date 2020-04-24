import { addEffect, getContext, reactiveFactory } from "./connect"
import { TeardownLogic } from "rxjs"

export function context<T extends object>(): T {
    return getContext<T>()
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(value, { shallow: false })
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(value)
}

export function watchEffect(fn: () => TeardownLogic) {
    addEffect(fn, { watch: true })
}

export function effect(fn: () => TeardownLogic) {
    addEffect(fn)
}
