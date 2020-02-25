import { Type } from "@angular/core"

export interface EffectMetadata<T = any> {
    name: string
    path: string
    type: Type<any>
    options: EffectOptions & T
    args: number[]
}

export interface EffectAdapter<TValue extends any, TOptions = DefaultEffectOptions> {
    next(value: TValue, metadata: EffectMetadata<TOptions & DefaultEffectOptions>): void
}

export interface DefaultEffectOptions {
    whenRendered?: boolean
    detectChanges?: boolean
    markDirty?: boolean
}

export interface BindEffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions {
    bind?: TKey
}

export interface AssignEffectOptions extends DefaultEffectOptions {
    assign?: boolean
}

export interface AdapterEffectOptions extends DefaultEffectOptions {
    adapter?: Type<EffectAdapter<any, any>>
}

export interface EffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions,
        BindEffectOptions<TKey>,
        AdapterEffectOptions,
        AssignEffectOptions {}

export abstract class EffectOptions<TKey extends PropertyKey | unknown = unknown> {}
