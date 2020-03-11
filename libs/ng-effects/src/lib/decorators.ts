import {
    AssignEffectOptions,
    BindEffectOptions,
    CreateEffectAdapter,
    DefaultEffectOptions,
    NextEffectAdapter,
    EffectOptions,
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

export function Effect(): DefaultEffectDecorator

export function Effect(options: DefaultEffectOptions): DefaultEffectDecorator

export function Effect<T extends string>(
    target: T,
    options?: DefaultEffectOptions,
): BindEffectDecorator<T>

export function Effect<T extends string>(options: BindEffectOptions<T>): BindEffectDecorator<T>

export function Effect<T extends object>(options: AssignEffectOptions): AssignEffectDecorator<T>

export function Effect<T, U>(
    adapter: Type<NextEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>

export function Effect<
    T extends (...args: any[]) => any,
    U,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : void
>(
    adapter: Type<CreateEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): CustomEffectDecorator<TArgs, ReturnType<T>>

export function Effect<T, U>(
    options: { adapter: Type<NextEffectAdapter<T, U>> } & U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>

export function Effect<
    T extends (...args: any[]) => any,
    U,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : never
>(
    options: { adapter: Type<CreateEffectAdapter<T, U>> } & U & DefaultEffectOptions,
): CustomEffectDecorator<TArgs, Observable<T>>

export function Effect(): any {
    let options: EffectOptions
    if (typeof arguments[0] === "string") {
        options = { bind: arguments[0], ...arguments[1] }
    } else if (typeof arguments[0] === "function") {
        options = { adapter: arguments[0], ...arguments[1] }
    } else {
        options = arguments[0]
    }
    return function(target: any, prop: any) {
        defineMetadata(Effect, options, target.constructor, prop)
    }
}

export type State<T> = MapSelect<T>
export type Context<T> = Readonly<T>

export function Context(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Context, parameterIndex, target.constructor, propertyKey)
    }
}

export function State(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(State, parameterIndex, target.constructor, propertyKey)
    }
}

export function Observe(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Observe, parameterIndex, target.constructor, propertyKey)
    }
}
