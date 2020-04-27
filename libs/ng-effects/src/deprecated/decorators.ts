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
    MapSelect,
} from "./internals/interfaces"
import { defineMetadata } from "./internals/metadata"
import { Type } from "@angular/core"
import { Observable } from "rxjs"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect(): DefaultEffectDecorator

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect(options: DefaultEffectOptions): DefaultEffectDecorator

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T extends string>(
    target: T,
    options?: DefaultEffectOptions,
): BindEffectDecorator<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T extends string>(options: BindEffectOptions<T>): BindEffectDecorator<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T extends object>(options: AssignEffectOptions): AssignEffectDecorator<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T, U>(
    adapter: Type<NextEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T extends (...args: any[]) => any, U>(
    adapter: Type<CreateEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): CustomEffectDecorator<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<T, U>(
    options: { adapter: Type<NextEffectAdapter<T, U>> } & U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect<
    T extends (...args: any[]) => any,
    U,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : never
>(
    options: { adapter: Type<CreateEffectAdapter<T, U>> } & U & DefaultEffectOptions,
): CustomEffectDecorator<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Effect(...args: any[]): any {
    let options: EffectOptions
    if (typeof args[0] === "string") {
        options = { bind: args[0], ...args[1] }
    } else if (typeof args[0] === "function") {
        options = { adapter: args[0], adapterOptions: args.slice(1) }
    } else {
        options = args[0]
    }
    return function(target: any, prop: any) {
        defineMetadata(Effect, options, target.constructor, prop)
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type State<T> = MapSelect<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type Context<T> = Readonly<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Context(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Context, parameterIndex, target.constructor, propertyKey)
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function State(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(State, parameterIndex, target.constructor, propertyKey)
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Observe(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Observe, parameterIndex, target.constructor, propertyKey)
    }
}
