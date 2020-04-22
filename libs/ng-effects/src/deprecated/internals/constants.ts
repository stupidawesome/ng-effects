import { DefaultEffectOptions } from "../interfaces"

export const effectsMap = new WeakMap()

export const globalDefaults: DefaultEffectOptions = {
    whenRendered: false,
    markDirty: undefined,
    detectChanges: undefined,
}
