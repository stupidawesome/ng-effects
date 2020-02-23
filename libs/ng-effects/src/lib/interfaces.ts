import { Observable, TeardownLogic } from "rxjs"
import { Type } from "@angular/core"
import { MapSelect } from "./internals/interfaces"

export type State<T> = MapSelect<Required<T>>
export type Context<T> = Readonly<T>

export type AnyEffectFn<T, U = any> = (
    state: MapSelect<T>,
    context: Context<T>,
    observer: Observable<T>,
) => Observable<U> | TeardownLogic

export type EffectFn<T, U = any> = (
    state: State<T>,
    context: Context<T>,
    observer: Observable<T>,
) => Observable<U> | TeardownLogic

export interface EffectMetadata<T = any> {
    name: string
    path: string
    type: Type<any>
    options: EffectOptions<T>
}

export interface EffectAdapter<TValue extends any, TOptions = DefaultEffectOptions> {
    next(value: TValue, metadata: EffectMetadata<TOptions & DefaultEffectOptions>): void
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
