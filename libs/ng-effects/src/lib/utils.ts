import {
    createEffect,
    getContext,
    reactiveFactory,
    targetSymbol,
    toRaw,
} from "./connect"
import { TeardownLogic } from "rxjs"
import { StopHandler } from "./interfaces"

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

export function watchEffect(effect: () => TeardownLogic): StopHandler {
    return createEffect(effect, {
        watch: true,
    })
}

export function effect(effect: () => TeardownLogic): StopHandler {
    return createEffect(effect)
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) === value
}
