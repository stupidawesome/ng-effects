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
    ConnectableObservable,
    EMPTY,
    from,
    merge,
    NEVER,
    Observable,
    OperatorFunction,
    PartialObserver,
    Subject,
    Subscribable,
    Unsubscribable,
} from "rxjs"
import { defineMetadata } from "../deprecated/internals/metadata"
import { NextFn } from "./utils"
import { share } from "rxjs/operators"

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
        return new EffectFactory(...args)
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

export type ActionConstructor<T extends unknown[], R extends object> = (
    ...args: T
) => R
export type ActionArgs<T> = T extends ActionConstructor<infer R, any>
    ? R
    : never
export type ActionType<T> = T extends ActionConstructor<any, infer R>
    ? R
    : never
export interface ActionCreator<U extends unknown, V extends any = object>
    extends Action {
    asObservable: () => Observable<V>
    (arg: U): V & Action
    (...args: U extends unknown[] ? U : never): V & Action
}
export interface Action {
    readonly type: string
}

export const noop: any = () => {}

const REJECT = Symbol()

export function reject(): never {
    throw REJECT
}

export function Action<
    T extends ActionConstructor<any[], any> = ActionConstructor<
        unknown[],
        object
    >
>(create: T = noop): ActionCreator<ActionArgs<T>, ActionType<T>> {
    const subject = new Subject()
    const symbol = Symbol()
    function Action(...args: any[]) {
        try {
            const action = create(...args) ?? {}
            Object.defineProperty(action, "type", {
                value: symbol,
            })
            subject.next(action)
            return action
        } catch (e) {
            if (e !== REJECT) {
                throw e
            }
        }
    }
    Action.type = symbol
    Action.asObservable = function () {
        return subject.asObservable()
    }

    return Action as ActionType<T>
}

export class EffectFactory<T extends any> extends Observable<T> {
    source: Observable<T>

    constructor(...actions: (Observable<T> | ActionCreator<any, T>)[]) {
        actions = actions.map((action) =>
            "asObservable" in action ? action.asObservable() : action,
        )
        super((subscriber) => this.source.subscribe(subscriber))
        const source = actions.length ? merge(...actions) : NEVER
        this.source = source.pipe<any>(share())
    }

    // prettier-ignore
    pipe(): EffectFactory<T>;
    // prettier-ignore
    pipe<A>(op1: OperatorFunction<T, A>): EffectFactory<A>;
    // prettier-ignore
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): EffectFactory<B>;
    // prettier-ignore
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): EffectFactory<C>;
    // prettier-ignore
    pipe<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): EffectFactory<D>;
    // prettier-ignore
    pipe<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): EffectFactory<E>;
    // prettier-ignore
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): EffectFactory<F>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): EffectFactory<G>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): EffectFactory<H>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): EffectFactory<I>;
    // prettier-ignore
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): EffectFactory<{}>;
    pipe(...operators: OperatorFunction<any, any>[]): EffectFactory<any> {
        const source = operators.reduce(
            (source, operator) => operator(source),
            from(this),
        )
        return new EffectFactory(source)
    }
}

export type Effect<T = unknown> = EffectFactory<T>

type InteropEffect = typeof EffectDecorator & typeof EffectFactory

export const Effect: InteropEffect = EffectDecorator as InteropEffect
