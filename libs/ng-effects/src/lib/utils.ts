import { effectsMap } from "./internals/constants"
import { EffectOptions } from "./decorators"
import { EffectFn } from "./interfaces"

export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options: EffectOptions<U> = {},
): EffectFn<T, T[U]> {
    effectsMap.set(fn, options)
    return fn
}
