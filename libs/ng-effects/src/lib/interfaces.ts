import { Observable, Subject, TeardownLogic } from "rxjs"
import { Type } from "@angular/core"

export type PropertyObservable<T> = Observable<T> & { changes: Observable<T> }

export type State<T> = {
    readonly [key in keyof T]: PropertyObservable<T[key]>
}

export interface Events<T> {
    $event?: T
    events: Observable<T>
}

export type EffectFn<T, U = any> = (state: State<T>, context: T) => Observable<U> | TeardownLogic
export type BoundEffectFn = () => Observable<unknown> | TeardownLogic

export interface EffectMetadata {
    name: string
    key: string
    effect: BoundEffectFn
    options: EffectOptions
    adapter?: EffectHandler<any, any>
    notifier: Subject<void>
}

export interface NextEffect<TValue, TOptions> {
    value: TValue
    options: TOptions
}

export interface EffectHandler<TValue, TOptions = never> {
    next(value: TValue, options: TOptions): void
}

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
