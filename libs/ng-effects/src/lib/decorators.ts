import { effectsMap } from "./internals/constants"
import { EffectFn } from "./interfaces"

export type Effects<T> = {
    [key in keyof T]?: EffectFn<T, T[key]>
}

export abstract class EffectOptions {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
}

export function Effect(options?: EffectOptions): MethodDecorator {
    return function(target: any, prop) {
        effectsMap.set(target[prop], options || {})
    }
}
