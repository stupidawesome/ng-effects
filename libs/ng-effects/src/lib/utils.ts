import { effectsMap } from "./internals/constants"
import {
    AssignEffectOptions,
    BindEffectOptions,
    DefaultEffectOptions,
    EffectFn,
    EffectHandler,
} from "./interfaces"
import { combineLatest, MonoTypeOperatorFunction, Observable } from "rxjs"
import { Type } from "@angular/core"
import { MapSelect, NextOptions, NextValue } from "./internals/interfaces"
import { map, skip } from "rxjs/operators"

export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options?: BindEffectOptions<U>,
): EffectFn<T, T[U]>
export function createEffect<T>(
    fn: EffectFn<T, Partial<T>>,
    options?: AssignEffectOptions,
): EffectFn<T, Partial<T>>
export function createEffect<T extends Type<EffectHandler<any, any>>, U>(
    fn: EffectFn<U, NextValue<InstanceType<T>>>,
    options?: { adapter: T } & (NextOptions<InstanceType<T>> | DefaultEffectOptions),
): EffectFn<U, NextValue<InstanceType<T>>>
export function createEffect<T, U extends keyof T>(
    fn: EffectFn<unknown>,
    options: any = {},
): EffectFn<unknown> {
    effectsMap.set(fn, options)
    return fn
}

function changesOperator<T>(source: Observable<T>) {
    return source.pipe(skip(1))
}

export function changes<T>(source: Observable<T>): Observable<T>
export function changes<T>(): MonoTypeOperatorFunction<T>
export function changes<T>(source?: Observable<T>): any {
    return source ? changesOperator(source) : changesOperator
}

export function latestFrom<T>(source: MapSelect<T>): Observable<T> {
    const keys = Object.keys(source) as (keyof T)[]
    return combineLatest(keys.map(key => source[key])).pipe(
        map(values =>
            values.reduce((acc, value, index) => {
                acc[keys[index]] = value as any
                return acc
            }, {} as T),
        ),
    )
}

export { HostEmitter } from "./internals/utils"
