import { Observable, TeardownLogic } from "rxjs"

export type PropertyObservable<T> = Observable<T> & { changes: Observable<T> }

export type State<T> = {
    readonly [key in keyof T]: PropertyObservable<T[key]>
}

export interface Events<T> {
    $event?: T
    events: Observable<T>
}

export type EffectFn<T, U = any> = (state: State<T>, context: T) => Observable<U> | TeardownLogic
