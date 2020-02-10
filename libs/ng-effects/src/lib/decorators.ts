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

export abstract class EffectOptions<TKey extends PropertyKey | unknown = unknown> {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
    bind?: TKey
}

interface EffectDecorator<TKey> {
    // tslint:disable-next-line:callable-types
    <T extends object, V extends keyof T = TKey extends keyof T ? TKey : never>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor: { value?: EffectFn<T, unknown extends TKey ? any : T[V]> },
    ): void
}

export function Effect(): EffectDecorator<unknown>
export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: EffectOptions<T>): EffectDecorator<T>
export function Effect(options?: any): EffectDecorator<unknown> {
    const opts: EffectOptions =
        typeof arguments[0] === "string" ? { bind: arguments[0], ...arguments[1] } : arguments[0]
    return function(target, prop, propertyDescriptor) {
        if (propertyDescriptor.value) {
            effectsMap.set(propertyDescriptor.value, opts || {})
        }
    }
}
