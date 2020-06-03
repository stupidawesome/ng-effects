import { SimpleChanges } from "@angular/core"
import { Context, Lifecycle } from "./interfaces"
import { flush } from "./effect"
import { getContext, getPhase } from "./ngfx"
import { invalidate } from "./invalidate"
import { LinkedList } from "./utils"

export function runHook(changes?: SimpleChanges) {
    const ctx = getContext()
    const phase = getPhase()
    const fns = hooks.get(ctx, phase)
    if (!hooks) {
        return
    }
    invalidate(phase)
    switch (phase) {
        case Lifecycle.OnCheck:
            flush("pre")
            break
        case Lifecycle.OnViewChecked:
            flush("post")
            break
    }
    for (const fn of fns ?? []) {
        fn(changes)
    }
}

const hooks = new LinkedList<Context, Lifecycle | undefined, Function>()

function attachHook(invalidate: Function, phase: Lifecycle) {
    const context = getContext()
    const currentPhase = getPhase()
    if (context && currentPhase === Lifecycle.OnConnect) {
        hooks.set(getContext(), phase, invalidate)
    }
}

export function onCheck(fn: () => void) {
    attachHook(fn, Lifecycle.OnCheck)
}

export function onInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnInit)
}

export function onChanges(fn: (changes: SimpleChanges) => void) {
    attachHook(fn, Lifecycle.OnChanges)
}

export function onContentInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnContentInit)
}

export function onContentChecked(fn: () => void) {
    attachHook(fn, Lifecycle.OnContentChecked)
}

export function onViewInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnViewInit)
}

export function onViewChecked(fn: () => void) {
    attachHook(fn, Lifecycle.OnViewChecked)
}

export function onDestroy(fn: () => any) {
    attachHook(fn, Lifecycle.OnDestroy)
}
