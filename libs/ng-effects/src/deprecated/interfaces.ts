import { Type } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface EffectMetadata<T = any> {
    name: string
    path: string
    type: Type<any>
    options: EffectOptions & T
    adapter: Type<any>
    args: number[]
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type EffectAdapter<TValue extends any, TOptions = unknown> = CreateEffectAdapter<
    TValue,
    TOptions
> &
    NextEffectAdapter<TValue, TOptions>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface CreateEffectAdapter<TFunction extends any, TOptions = unknown> {
    create?(factory: TFunction, metadata: EffectMetadata<TOptions>): Observable<any> | TeardownLogic
    next?(value: any, metadata: EffectMetadata<TOptions>): void
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface NextEffectAdapter<TValue extends any, TOptions = unknown> {
    next?(value: TValue, metadata: EffectMetadata<TOptions>): void
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface DefaultEffectOptions {
    whenRendered?: boolean
    detectChanges?: boolean
    markDirty?: boolean
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface BindEffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions {
    bind?: TKey
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface AssignEffectOptions extends DefaultEffectOptions {
    assign?: boolean
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface AdapterEffectOptions extends DefaultEffectOptions {
    adapter?: Type<NextEffectAdapter<any, any>>
    adapterOptions?: any
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export interface EffectOptions<TKey extends PropertyKey | unknown = unknown>
    extends DefaultEffectOptions,
        BindEffectOptions<TKey>,
        AdapterEffectOptions,
        AssignEffectOptions {}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export abstract class EffectOptions<TKey extends PropertyKey | unknown = unknown> {}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type ObservableSources<T> = {
    [key in keyof T]: Observable<T[key]>
}
