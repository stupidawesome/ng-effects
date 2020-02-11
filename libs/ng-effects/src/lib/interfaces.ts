import { Observable, TeardownLogic } from "rxjs"
import { EffectOptions } from "./decorators"

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
}

export interface NextEffect<TValue, TOptions> {
    value: TValue
    options: TOptions
}

export interface EffectHandler<TValue, TOptions = never> {
    next(value: TValue, options: TOptions): void
}
