import { Type } from "@angular/core"
import {
    AssignEffectOptions,
    BindEffectOptions,
    CreateEffectAdapter,
    DefaultEffectOptions,
    EffectOptions,
    NextEffectAdapter,
} from "../deprecated/interfaces"
import {
    AdapterEffectDecorator,
    AssignEffectDecorator,
    BindEffectDecorator,
    CustomEffectDecorator,
    DefaultEffectDecorator,
} from "../deprecated/internals/interfaces"
import {
    Observable,
    OperatorFunction,
    PartialObserver,
    Subject,
    Subscribable,
    Subscription,
} from "rxjs"
import { defineMetadata } from "../deprecated/internals/metadata"
import { NextFn } from "./utils"
import { Callable } from "../deprecated/internals/callable"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(): DefaultEffectDecorator
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(options: DefaultEffectOptions): DefaultEffectDecorator
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends string>(
    target: T,
    options?: DefaultEffectOptions,
): BindEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends string>(
    options: BindEffectOptions<T>,
): BindEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends object>(
    options: AssignEffectOptions,
): AssignEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T, U>(
    adapter: Type<NextEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T extends (...args: any[]) => any, U>(
    adapter: Type<CreateEffectAdapter<T, U>>,
    options?: U & DefaultEffectOptions,
): CustomEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<T, U>(
    options: { adapter: Type<NextEffectAdapter<T, U>> } & U &
        DefaultEffectOptions,
): AdapterEffectDecorator<Observable<T>>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator<
    T extends (...args: any[]) => any,
    U,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : never
>(
    options: { adapter: Type<CreateEffectAdapter<T, U>> } & U &
        DefaultEffectOptions,
): CustomEffectDecorator<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
function EffectDecorator(...args: any[]): any {
    if (new.target) {
        return new EffectFactory(args[0])
    }
    let options: EffectOptions
    if (typeof args[0] === "string") {
        options = { bind: args[0], ...args[1] }
    } else if (typeof args[0] === "function") {
        options = { adapter: args[0], adapterOptions: args.slice(1) }
    } else {
        options = args[0]
    }
    return function (target: any, prop: any) {
        defineMetadata(Effect, options, target.constructor, prop)
    }
}

export class EffectFactory<T extends any, U = T> extends Callable<NextFn<T>> {
    source = new Subject<T>()
    private destination: Observable<U>
    constructor(lift?: OperatorFunction<T, U>) {
        super(function (...args: any[]) {
            self.source.next(args.length === 1 ? args[0] : args)
        } as NextFn<T>)
        const self = this
        this.destination = (lift
            ? this.source.pipe(lift)
            : this.source) as Observable<U>
    }

    pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
        if (operations.length === 0) {
            return this as any
        }

        return (<any>this.destination.pipe)(...operations)
    }

    next(value: T) {
        this.source.next(value)
    }

    complete() {
        this.source.complete()
    }

    error(err: any) {
        this.source.error(err)
    }

    unsubscribe() {
        this.source.unsubscribe()
    }

    subscribe<V = U extends unknown ? T : U>(
        observer?: PartialObserver<V> | ((value: V) => void),
    ): Subscription
    subscribe(observer?: any): Subscription {
        return this.destination.subscribe(observer)
    }
}

// prettier-ignore
export type Effect<T, U = T> = Subject<U> &
    NextFn<T> & {
        source: Observable<T>
        destination: Observable<U>
    }

// prettier-ignore
type InteropEffect = typeof EffectDecorator & {
    new<T, R>(lift: OperatorFunction<T, R>): Effect<T, R>
    new<T1, T2, R>(lift: OperatorFunction<[T1, T2], R>): Effect<[T1, T2], R>
    new<T1, T2, T3, R>(lift: OperatorFunction<[T1, T2, T3], R>): Effect<[T1, T2, T3], R>
    new<T1, T2, T3, T4, R>(lift: OperatorFunction<[T1, T2, T3, T4], R>): Effect<[T1, T2, T3, T4], R>
    new<T1, T2, T3, T4, T5, R>(lift: OperatorFunction<[T1, T2, T3, T4, T5], R>): Effect<[T1, T2, T3, T4, T5], R>
    new<T1, T2, T3, T4, T5, T6, R>(lift: OperatorFunction<[T1, T2, T3, T4, T5, T6], R>): Effect<[T1, T2, T3, T4, T5, T6], R>
    new<T1, T2, T3, T4, T5, T6, T7, R>(lift: OperatorFunction<[T1, T2, T3, T4, T5, T6, T7], R>): Effect<[T1, T2, T3, T4, T5, T6, T7], R>
    new<T1, T2, T3, T4, T5, T6, T7, T8, R>(lift: OperatorFunction<[T1, T2, T3, T4, T5, T6, T7, T8], R>): Effect<[T1, T2, T3, T4, T5, T6, T7, T8], R>
    new<T1, T2, T3, T4, T5, T6, T7, T8, T9, R>(lift: OperatorFunction<[T1, T2, T3, T4, T5, T6, T7, T8], R>): Effect<[T1, T2, T3, T4, T5, T6, T7, T8, T9], R>
    new<T = void>(): Effect<T>
    new<T1, T2>(): Effect<[T1, T2]>
    new<T1, T2, T3>(): Effect<[T1, T2, T3]>
    new<T1, T2, T3, T4>(): Effect<[T1, T2, T3, T4]>
    new<T1, T2, T3, T4, T5>(): Effect<[T1, T2, T3, T4, T5]>
    new<T1, T2, T3, T4, T5, T6>(): Effect<[T1, T2, T3, T4, T5, T6]>
    new<T1, T2, T3, T4, T5, T6, T7>(): Effect<[T1, T2, T3, T4, T5, T6, T7]>
    new<T1, T2, T3, T4, T5, T6, T7, T8>(): Effect<[T1, T2, T3, T4, T5, T6, T7, T8]>
    new<T1, T2, T3, T4, T5, T6, T7, T8, T9>(): Effect<[T1, T2, T3, T4, T5, T6, T7, T9]>
}

export const Effect: InteropEffect = EffectDecorator as InteropEffect
