import { DefaultEffectOptions, EffectFn, EffectMetadata } from "../interfaces"
import { InjectionToken } from "@angular/core"

export const effectsMap = new WeakMap<EffectFn<any>, any>()

export const defaultOptions: Required<DefaultEffectOptions> = {
    whenRendered: false,
    detectChanges: false,
    markDirty: false,
}

export const EFFECTS = new InjectionToken<EffectMetadata[]>("EFFECTS")

export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")
