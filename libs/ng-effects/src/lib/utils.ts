import { effectsMap } from "./internals/constants"
import {
    ApplyEffectOptions,
    BindEffectOptions,
    EffectFn,
    EffectHandler,
    EffectOptions,
} from "./interfaces"
import { Subject } from "rxjs"
import { Type } from "@angular/core"
import { NextValue } from "./decorators"

export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options?: BindEffectOptions<U>,
): EffectFn<T, T[U]>
export function createEffect<T>(
    fn: EffectFn<T, Partial<T>>,
    options?: ApplyEffectOptions,
): EffectFn<T, Partial<T>>
export function createEffect<T extends EffectHandler<U, V>, U, V>(
    fn: EffectFn<any, U>,
    options: { adapter: Type<T> } & V,
): EffectFn<any, NextValue<T>>
export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options: any = {},
): EffectFn<T, T[U]> {
    if (options.apply && options.bind) {
        delete options.bind
    }
    effectsMap.set(fn, options)
    return fn
}

export class EffectsObserver extends Subject<
    [any, EffectOptions, { className: string; key: string }]
> {}
