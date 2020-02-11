import { EffectFn } from "../interfaces"
import { InjectionToken } from "@angular/core"

export let bootstrapCallback: Function
export const resolveBoostrap = new Promise(resolve => {
    bootstrapCallback = resolve
})
export const effectsMap = new WeakMap<EffectFn<any>>()
export const APPLICATION_BOOTSTRAP = new InjectionToken("APPLICATION_BOOTSTRAP", {
    factory: () => resolveBoostrap,
})
export const currentContext = new Set()
