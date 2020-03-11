import { Type } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"

export interface EffectMetadata<T = any> {
    name: string
    path: string
    type: Type<any>
    options: EffectOptions & T
    args: number[]
}

export type EffectAdapter<TValue extends any, TOptions = unknown> = CreateEffectAdapter<
    TValue,
    TOptions
> &
    NextEffectAdapter<TValue, TOptions>

export interface CreateEffectAdapter<TFunction extends any, TOptions = unknown> {
    create?(factory: TFunction, metadata: EffectMetadata<TOptions>): Observable<any> | TeardownLogic
    next?(value: any, metadata: EffectMetadata<TOptions>): void
}

export interface NextEffectAdapter<TValue extends any, TOptions = unknown> {
    next?(value: TValue, metadata: EffectMetadata<TOptions>): void
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
    adapter?: Type<NextEffectAdapter<any, any>>
}

export interface EffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions,
        BindEffectOptions<TKey>,
        AdapterEffectOptions,
        AssignEffectOptions {}

export abstract class EffectOptions<TKey extends PropertyKey | unknown = unknown> {}
