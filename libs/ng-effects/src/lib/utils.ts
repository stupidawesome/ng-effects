import { effectsMap } from "./internals/constants"
import { ApplyEffectOptions, BindEffectOptions, EffectFn, EffectHandler } from "./interfaces"
import { combineLatest, MonoTypeOperatorFunction, Observable } from "rxjs"
import { Type } from "@angular/core"
import { NextValue } from "./decorators"
import { MapSelect } from "./internals/interfaces"
import { map, skip } from "rxjs/operators"

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

function changesOperator<T>(source: Observable<T>) {
    return source.pipe(skip(1))
}

export function changes<T>(source: Observable<T>): Observable<T>
export function changes<T>(): MonoTypeOperatorFunction<T>
export function changes<T>(source?: Observable<T>): any {
    return source ? changesOperator(source) : changesOperator
}

export function latest<T>(source: MapSelect<T>): Observable<T> {
    const keys = Object.keys(source) as (keyof T)[]
    return combineLatest(keys.map(key => source[key])).pipe(
        map(values =>
            values.reduce((acc, value, index) => {
                acc[keys[index]] = value
                return acc
            }, {} as T),
        ),
    )
}
