import { effectsMap } from "./internals/constants"
import { EffectFn } from "./interfaces"

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

export interface EffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions,
        BindEffectOptions<TKey>,
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

export function Effect(): EffectDecorator<unknown>
export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: BindEffectOptions<T>): EffectDecorator<T>
export function Effect<T extends ApplyEffectOptions>(options?: T): EffectDecorator<T["apply"]>
export function Effect(): EffectDecorator<unknown> {
    const opts: EffectOptions =
        typeof arguments[0] === "string" ? { bind: arguments[0], ...arguments[1] } : arguments[0]
    if (opts && opts.apply && opts.bind) {
        delete opts.bind
    }
    return function(target, prop, propertyDescriptor) {
        if (propertyDescriptor.value) {
            effectsMap.set(propertyDescriptor.value, opts || {})
        }
    }
}
