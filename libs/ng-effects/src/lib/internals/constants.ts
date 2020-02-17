import { DefaultEffectOptions, EffectFn } from "../interfaces"
import { Subject } from "rxjs"

export const effectsMap = new WeakMap<EffectFn<any>, any>()
export const currentContext = new Set()

export const defaultOptions: DefaultEffectOptions = {
    whenRendered: false,
    detectChanges: false,
    markDirty: false,
}

export const globalNotifier = new Subject()
