import { effectsMap } from "./internals/constants"
import { EffectFn } from "./interfaces"

export type Effects<T> = {
    [key in keyof T]?: EffectFn<T, T[key]>
}

export interface DefaultEffectOptions {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
}

export abstract class EffectOptions {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
    target?: string
}

export function Effect(target?: string, options?: DefaultEffectOptions): MethodDecorator
export function Effect(options?: EffectOptions): MethodDecorator
export function Effect(options?: any): MethodDecorator {
    const opts =
        typeof arguments[0] === "string" ? { target: options, ...arguments[1] } : arguments[0]
    return function(target: any, prop) {
        effectsMap.set(target[prop], opts || {})
    }
}
