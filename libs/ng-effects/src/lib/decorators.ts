import { effectsMap } from "./internals/constants"
import {
    AnyEffectFn,
    AssignEffectOptions,
    BindEffectOptions,
    DefaultEffectOptions,
    EffectFn,
    EffectHandler,
    EffectOptions,
} from "./interfaces"
import { Type } from "@angular/core"
import { NextOptions, NextValue } from "./internals/interfaces"

interface EffectDecorator<TKey> {
    // tslint:disable-next-line:callable-types
    <T extends object, V extends keyof T = TKey extends keyof T ? TKey : never>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor: {
            value?: EffectFn<T, unknown extends TKey ? any : true extends TKey ? Partial<T> : T[V]>
        },
    ): void
}

export interface EffectAdapterDecorator<T> {
    // tslint:disable-next-line:callable-types
    (
        target: any,
        prop: any,
        propertyDescriptor: {
            value?: AnyEffectFn<any, T>
        },
    ): void
}

export function Effect<T extends Type<EffectHandler<any, any>>>(
    adapter: T,
    options?: NextOptions<InstanceType<T>> & DefaultEffectOptions,
): EffectAdapterDecorator<NextValue<InstanceType<T>>>
export function Effect<T extends Type<EffectHandler<any, any>>, TOptions = NextOptions<InstanceType<T>>, TValue = NextValue<InstanceType<T>>>(
    options?: { adapter: T } & TOptions & DefaultEffectOptions,
): EffectAdapterDecorator<TValue>
export function Effect(): EffectDecorator<unknown>
export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: BindEffectOptions<T>): EffectDecorator<T>
export function Effect<T extends AssignEffectOptions>(options?: T): EffectDecorator<T["assign"]>
export function Effect(): EffectDecorator<unknown> {
    let opts: EffectOptions
    if (typeof arguments[0] === "string") {
        opts = { bind: arguments[0], ...arguments[1] }
    } else if (typeof arguments[0] === "function") {
        opts = { adapter: arguments[0], ...arguments[1] }
    } else {
        opts = arguments[0]
    }
    return function(target, prop, propertyDescriptor: any) {
        effectsMap.set(propertyDescriptor.value, opts || {})
    }
}
