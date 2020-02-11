import { effectsMap } from "./internals/constants"
import { EffectFn, EffectHandler } from "./interfaces"
import { Type } from "@angular/core"

export type Effects<T> = {
    [key in keyof T]?: EffectFn<T, T[key]>
}

export interface DefaultEffectOptions {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
}

export interface BindEffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions {
    bind?: TKey
}

export interface ApplyEffectOptions extends DefaultEffectOptions {
    apply?: boolean
}

export interface AdapterEffectOptions {
    adapter?: Type<EffectHandler<any, any>>
}

export interface EffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions,
        BindEffectOptions<TKey>,
        AdapterEffectOptions,
        ApplyEffectOptions {}

export abstract class EffectOptions<TKey extends PropertyKey | unknown = unknown> {}

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
            value?: EffectFn<any, T>
        },
    ): void
}

export type NextValue<T extends any> = T["next"] extends (value: infer R, options?: any) => any
    ? R
    : never

export function Effect(): EffectDecorator<unknown>
export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: BindEffectOptions<T>): EffectDecorator<T>
export function Effect<T extends ApplyEffectOptions>(options?: T): EffectDecorator<T["apply"]>
export function Effect<T extends EffectHandler<U, V>, U, V>(
    adapter: Type<T>,
    options?: V,
): EffectAdapterDecorator<NextValue<T>>
export function Effect(): EffectDecorator<unknown> {
    let opts: EffectOptions
    if (typeof arguments[0] === "string") {
        opts = { bind: arguments[0], ...arguments[1] }
    } else if (typeof arguments[0] === "function") {
        opts = { adapter: arguments[0], ...arguments[1] }
    } else {
        opts = arguments[0]
    }
    return function(target, prop, propertyDescriptor) {
        if (propertyDescriptor.value) {
            effectsMap.set(propertyDescriptor.value, opts || {})
        }
    }
}
