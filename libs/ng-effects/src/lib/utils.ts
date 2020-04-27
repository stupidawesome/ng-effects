import { addEffect, getContext, reactiveFactory, targetSymbol } from "./connect"
import { TeardownLogic } from "rxjs"

export function context<T extends object>(): T {
    return getContext<T>()
}

export function rawContext<T extends object>(): T {
    return toRaw(getContext<T>())
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value, { shallow: false })
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value)
}

export function watchEffect(fn: () => TeardownLogic) {
    addEffect(fn, { watch: true })
}

export function effect(fn: () => TeardownLogic) {
    addEffect(fn)
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) === value
}

export function toRaw<T extends object>(value: T): T {
    return Reflect.get(value, targetSymbol) || value
}
