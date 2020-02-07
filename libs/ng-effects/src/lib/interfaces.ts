import { Observable, Subscription } from "rxjs"

export type State<T> = {
    readonly [key in keyof Required<T>]: Observable<T[key]> & { changes: Observable<T[key]> }
}

export type EffectFn<T, U = any> = (
    state: State<T>,
    context: T,
) => Observable<U extends infer R ? R : any> | Subscription | void
