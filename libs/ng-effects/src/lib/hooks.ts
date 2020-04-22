import { TeardownLogic } from "rxjs"
import { addEffect, addHook } from "./connect"
import { LifecycleHook } from "./interfaces"

export function effect(fn: () => TeardownLogic) {
    addEffect(fn)
}

export function onChanges(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.OnChanges)
}

export function afterViewInit(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.AfterViewInit)
}

export function whenRendered(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.WhenRendered)
}

export function onDestroy(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.OnDestroy)
}
