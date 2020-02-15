import { DefaultEffectOptions, EffectFn } from "../interfaces"

export const effectsMap = new Map<EffectFn<any>, any>()
export const currentContext = new Set()

export const defaultOptions: DefaultEffectOptions = {
    whenRendered: false,
    detectChanges: false,
    markDirty: false,
}
