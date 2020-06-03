import {
    Notification,
    Observable,
    OperatorFunction,
    PartialObserver,
    pipe,
    Subject,
} from "rxjs"
import { materialize, repeat } from "rxjs/operators"
import { EventEmitter } from "@angular/core"
import {
    createEffect,
    StopHandle,
    watch,
    WatchSource,
    WatchValues,
} from "./effect"
import { WatchEffectOptions } from "./interfaces"
import { UnwrapRef } from "./ref"

export function fromRef<T extends [WatchSource<any>, ...WatchSource<any>[]]>(
    ref: T,
    options?: WatchEffectOptions,
): Observable<WatchValues<T>>
export function fromRef<T>(
    ref: WatchSource<T>,
    options?: WatchEffectOptions,
): Observable<UnwrapRef<T>>
export function fromRef(
    ref: WatchSource<unknown>,
    options?: WatchEffectOptions,
): Observable<unknown> {
    return new Observable((subscriber) => {
        return watch(
            ref,
            (value) => {
                subscriber.next(value)
            },
            options,
        )
    })
}

export class Effect<T, U = T> extends Observable<Notification<U>> {
    private _source: Subject<T>
    private _operator?: OperatorFunction<any, any>

    constructor(operator?: OperatorFunction<T, U>) {
        super((subscriber) => destination.subscribe(subscriber))
        const destination = new Subject<any>()
        this._source = new EventEmitter<T>(true)
        this._operator = operator
        if (operator) {
            repeat()(materialize<U>()(operator(this._source))).subscribe(
                destination,
            )
        } else {
            this._source.subscribe(destination)
        }
    }

    next(value: T) {
        this._source.next(value)
    }

    error(err: any) {
        this._source.error(err)
    }

    complete() {
        this._source.complete()
    }

    pipe(): Effect<U>
    // prettier-ignore
    pipe<A>(op1: OperatorFunction<U, A>): Effect<U, A>;
    // prettier-ignore
    pipe<A, B>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>): Effect<U, B>;
    // prettier-ignore
    pipe<A, B, C>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Effect<U, C>;
    // prettier-ignore
    pipe<A, B, C, D>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): Effect<U, D>;
    // prettier-ignore
    pipe<A, B, C, D, E>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): Effect<U, E>;
    // prettier-ignore
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): Effect<U, F>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): Effect<U, G>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): Effect<U, H>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): Effect<U, I>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<U, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): Effect<U, {}>;
    pipe(...operators: OperatorFunction<any, any>[]): unknown {
        operators = this._operator
            ? [this._operator].concat(operators)
            : operators
        return new Effect((<any>pipe)(...operators))
    }
}

export function effect<T, U = T>(): Effect<T, U> {
    return new Effect()
}

const errorObservers = new WeakMap()

function subscribe(source: Observable<any>, observer: PartialObserver<any>) {
    if (observer.error && !errorObservers.has(source)) {
        errorObservers.set(source, true)
    }
    return source.subscribe({
        complete() {
            observer.complete?.()
        },
        error(err: any) {
            if (!errorObservers.has(source)) {
                throw err
            } else {
                observer.error?.(err)
            }
        },
        next(value: any) {
            if (value instanceof Notification) {
                if (value.kind === "E" && !errorObservers.has(source)) {
                    throw value.error
                } else {
                    value.observe(observer)
                }
            } else {
                observer.next?.(value)
            }
        },
    })
}

export function observe<T>(
    source: Observable<T | Notification<T>>,
    observer: PartialObserver<T> | ((value: T) => void),
): StopHandle
export function observe<T>(
    source: Observable<T | Notification<T>>,
    observer: PartialObserver<T> | ((value: T) => void),
): StopHandle
export function observe<T>(
    source: Observable<T | Notification<T>>,
    observer: PartialObserver<T> | ((value: T) => void),
): StopHandle {
    const obs = typeof observer === "function" ? { next: observer } : observer

    return createEffect((onInvalidate) => {
        const subscription = subscribe(source, obs)
        onInvalidate(() => subscription.unsubscribe())
    })
}

export function observeError(
    source: Observable<any>,
    observer: (err: any) => void,
) {
    return observe(source, { error: observer })
}
