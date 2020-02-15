import { DefaultEffectOptions, EffectFn } from "../interfaces"
import { InjectionToken, ɵdetectChanges as detectChanges } from "@angular/core"

export const effectsMap = new WeakMap<EffectFn<any>, any>()
export const currentContext = new Set()

export const defaultOptions: DefaultEffectOptions = {
    whenRendered: false,
    detectChanges: false,
    markDirty: false,
}

export const DETECT_CHANGES = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => detectChanges,
})
export const MARK_DIRTY = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => detectChanges,
})
