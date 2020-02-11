import { effectsMap } from "./internals/constants"
import { ApplyEffectOptions, BindEffectOptions, EffectOptions } from "./decorators"
import { EffectFn } from "./interfaces"

export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options: BindEffectOptions<U>,
): EffectFn<T, T[U]>
export function createEffect<T>(
    fn: EffectFn<T, Partial<T>>,
    options: ApplyEffectOptions,
): EffectFn<T, Partial<T>>
export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options: EffectOptions = {},
): EffectFn<T, T[U]> {
    if (options.apply && options.bind) {
        delete options.bind
    }
    effectsMap.set(fn, options)
    return fn
}
