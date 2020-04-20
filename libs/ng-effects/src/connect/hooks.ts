import { Injector } from "@angular/core"
import { unsubscribe } from "./utils"

let _context: Injector
let _hook: LifeCycleHooks | undefined

export function setContext(context?: any, hook?: LifeCycleHooks) {
    _context = context
    _hook = hook
}

export function getContext() {
    return _context
}

export function getLifeCycle() {
    return _hook !== undefined ? _hook + 1 : undefined
}

export function flush(hook: LifeCycleHooks) {
    const effects = getHooks(hook)
    if (effects) {
        unsubscribe([...effects])
        effects.clear()
    }
}

const hooks = new WeakMap()

export enum LifeCycleHooks {
    OnChanges = 1,
    OnChangesEffects = 2,
    AfterViewInit = 3,
    AfterViewInitEffects = 4,
    WhenRendered = 5,
    WhenRenderedEffects,
    OnDestroy,
}

export function addHook(hook: LifeCycleHooks | undefined, callback: Function) {
    if (hook === undefined) {
        return
    }
    const context = getContext()
    if (!hooks.has(context)) {
        hooks.set(context, new Map())
    }
    const map = hooks.get(context)
    if (!map.has(hook)) {
        map.set(hook, new Set())
    }
    const callbacks = map.get(hook)
    callbacks.add(callback)
}

export function getHooks(hook: LifeCycleHooks): Set<Function> | undefined {
    const context = getContext()
    return hooks.get(context)?.get(hook)
}
