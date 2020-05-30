import { Type } from "@angular/core"
import {
    AssignEffectOptions,
    BindEffectOptions,
    CreateEffectAdapter,
    DefaultEffectOptions,
    EffectOptions,
    NextEffectAdapter,
} from "./interfaces"
import {
    AdapterEffectDecorator,
    AssignEffectDecorator,
    BindEffectDecorator,
    CustomEffectDecorator,
    DefaultEffectDecorator,
} from "./internals/interfaces"
import { from, merge, NEVER, Observable, OperatorFunction, Subject } from "rxjs"
import { defineMetadata } from "./internals/metadata"
import { share } from "rxjs/operators"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(): DefaultEffectDecorator
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(options: DefaultEffectOptions): DefaultEffectDecorator
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends string>(
    target: T,
    options?: DefaultEffectOptions,
): BindEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends string>(
    options: BindEffectOptions<T>,
): BindEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends object>(
    options: AssignEffectOptions,
): AssignEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T, U>(
    adapter: Type<NextEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends (...args: any[]) => any, U>(
    adapter: Type<CreateEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): CustomEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T, U>(
    options: { adapter: Type<NextEffectAdapter<T, U>> } & U &
        DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<
    T extends (...args: any[]) => any,
    U,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : never
>(
    options: { adapter: Type<CreateEffectAdapter<T, U>> } & U &
        DefaultEffectOptions,
): CustomEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(...args: any[]): any {
    let options: EffectOptions
    if (typeof args[0] === "string") {
        options = { bind: args[0], ...args[1] }
    } else if (typeof args[0] === "function") {
        options = { adapter: args[0], adapterOptions: args.slice(1) }
    } else {
        options = args[0]
    }
    return function (target: any, prop: any) {
        defineMetadata(Effect, options, target.constructor, prop)
    }
}

type InteropEffect = typeof EffectDecorator

export const Effect: InteropEffect = EffectDecorator as InteropEffect
