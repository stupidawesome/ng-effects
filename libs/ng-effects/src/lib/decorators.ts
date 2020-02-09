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

export abstract class EffectOptions<TKey extends PropertyKey = string> {
    detectChanges?: boolean
    whenRendered?: boolean
    markDirty?: boolean
    bind?: TKey
}

interface EffectDecorator<PropertyKey> {
    // tslint:disable-next-line:callable-types
    <
        T extends object,
        U extends string,
        V extends keyof T = PropertyKey extends keyof T ? PropertyKey : any
    >(
        target: any,
        prop: U,
        propertyDescriptor: { value?: EffectFn<T, T[V]> },
    ): void
}

export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: EffectOptions<T>): EffectDecorator<T>
export function Effect(options?: any): EffectDecorator<unknown> {
    const opts: EffectOptions =
        typeof arguments[0] === "string" ? { bind: options, ...arguments[1] } : arguments[0]
    return function(target, prop, propertyDescriptor) {
        effectsMap.set(propertyDescriptor.value, opts || {})
    }
}
