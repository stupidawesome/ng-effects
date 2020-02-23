import { DefaultEffectOptions, EffectFn, EffectMetadata } from "../interfaces"
import { InjectionToken } from "@angular/core"

export const effectsMap = new WeakMap<EffectFn<any>, any>()

export const globalDefaults: DefaultEffectOptions = {
    whenRendered: false,
    markDirty: undefined,
    detectChanges: undefined,
}

export const EFFECTS = new InjectionToken<EffectMetadata[]>("EFFECTS")
