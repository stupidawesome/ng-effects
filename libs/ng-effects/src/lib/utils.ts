import {
    createEffect,
    getContext,
    reactiveFactory,
    targetSymbol,
} from "./connect"
import { TeardownLogic } from "rxjs"
import { LifecycleHook, StopHandler } from "./interfaces"
import { getLifecycleHook } from "./lifecycle"

export function context<T extends object>(): T {
    return getContext<T>()
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value)
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value, { shallow: true })
}

// TODO: investigate sync/pre flush options
export function watchEffect(effect: () => TeardownLogic): StopHandler {
    return createEffect(effect, {
        watch: true,
    })
}

export function effect(effect: () => TeardownLogic): StopHandler {
    return createEffect(effect)
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) !== undefined
}

export function isOnDestroy() {
    return getLifecycleHook() === LifecycleHook.OnDestroy
}
