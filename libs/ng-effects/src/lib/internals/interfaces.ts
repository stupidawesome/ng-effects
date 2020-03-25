import { ChangeDetectorRef } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"
import { HostEmitter } from "../host-emitter"
import { Context, State } from "../decorators"

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenScheduled(): Observable<void>
    whenRendered(): Observable<void>
}

export type MapSelect<T> = {
    [key in keyof T]-?: T[key] extends HostEmitter<any> ? T[key] : Observable<T[key]>
}

export interface AdapterEffectFn<TArgs extends any[], TReturn> {
    (a1: TArgs[0]): TReturn
}

export interface AdapterEffectFn2<TArgs extends any[], TReturn> {
    (a1: TArgs[0], a2: TArgs[1]): TReturn
}

export interface AdapterEffectFn3<TArgs extends any[], TReturn> {
    (a1: TArgs[0], a2: TArgs[1], a3: TArgs[2]): TReturn
}

export interface AdapterEffectFn4<TArgs extends any[], TReturn> {
    (a1: TArgs[0], a2: TArgs[1], a3: TArgs[2], a4: TArgs[3]): TReturn
}

export interface AdapterEffectFn5<TArgs extends any[], TReturn> {
    (a1: TArgs[0], a2: TArgs[1], a3: TArgs[2], a4: TArgs[3], a5: TArgs[4]): TReturn
}

export interface AdapterEffectFn6<TArgs extends any[], TReturn> {
    (a1: TArgs[0], a2: TArgs[1], a3: TArgs[2], a4: TArgs[3], a5: TArgs[4], ...args: any[]): TReturn
}

export interface AdapterEffectFn7<TReturn> {
    (): TReturn
}

export interface EffectFn<TReturn, T extends EffectArg<any>, X extends TReturn> {
    (state: T): X
}

export interface EffectFn2<
    TReturn,
    T extends EffectArg<any>,
    U extends EffectArg<any>,
    X extends TReturn
> {
    (state: T, context: U): EffectTarget<T> extends EffectTarget<U> ? TReturn : never
}

export interface EffectFn3<
    TReturn,
    T extends EffectArg<any>,
    U extends EffectArg<any>,
    V extends EffectArg<any>,
    X extends TReturn
> {
    (state: T, context: U, observer: V): EffectTarget<T> extends EffectTarget<U | V> ? X : never
}

export interface EffectFn4<TReturn extends any> {
    (): TReturn
}

export interface BindEffectFn<T extends any, TReturn extends any> {
    (state: T): TReturn
}

export interface BindEffectFn2<T extends any, U extends any, TReturn extends any> {
    (state: T, context: U): TReturn
}

export interface BindEffectFn3<T extends any, U extends any, V extends any, TReturn extends any> {
    (state: T, context: U, observer: V): TReturn
}

export interface BindEffectFn4 {
    (): any
}

export interface AssignEffectFn<TArg extends any, TReturn extends any> {
    (state: TArg): TReturn
}

export interface AssignEffectFn2<TArg extends any, TArg2 extends any, TReturn extends any> {
    (state: TArg, context: TArg2): TReturn
}

export interface AssignEffectFn3<
    TArg extends any,
    TArg2 extends any,
    TArg3 extends any,
    TReturn extends any
> {
    (state: TArg, context: TArg2, observer: TArg3): TReturn
}

export interface AssignEffectFn4<TReturn> {
    (): TReturn
}

export type EffectArg<T extends any = any> = State<T> | Context<T> | Observable<any>
export type EffectTarget<T> = T extends State<infer R> | Context<infer R> | Observable<infer R>
    ? R
    : never
export type BindReturnType<T, TKey extends keyof T> = T[TKey] extends HostEmitter<infer R>
    ? Observable<unknown extends R ? any : R>
    : Observable<T[TKey]>
export type AssignReturnType<T> = Observable<Partial<T>>

export interface DefaultEffectDecorator {
    <U, V, W, T extends Observable<any> | TeardownLogic, X extends T>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<EffectFn<T, U, X>>
            | TypedPropertyDescriptor<EffectFn2<T, U, V, X>>
            | TypedPropertyDescriptor<EffectFn3<T, U, V, W, X>>
            | TypedPropertyDescriptor<EffectFn4<T>>,
    ): void
}

export interface AdapterEffectDecorator<T> {
    <U, V, W, X extends T>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<EffectFn<T, U, X>>
            | TypedPropertyDescriptor<EffectFn2<T, U, V, X>>
            | TypedPropertyDescriptor<EffectFn3<T, U, V, W, X>>
            | TypedPropertyDescriptor<EffectFn4<X>>,
    ): void
}

export interface CustomEffectDecorator<
    T extends (...args: any[]) => any,
    TArgs extends any[] = T extends (...args: infer R) => any ? R : void,
    TReturn = ReturnType<T>
> {
    <U extends TArgs, V extends TReturn>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<AdapterEffectFn<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn2<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn3<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn4<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn5<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn6<U, V>>
            | TypedPropertyDescriptor<AdapterEffectFn7<V>>,
    ): void
}

export interface BindEffectDecorator<TKey extends PropertyKey> {
    <
        TReturn extends BindReturnType<T, TKey extends keyof T ? TKey : never>,
        TArg extends EffectArg<T>,
        TArg2 extends EffectArg<T>,
        TArg3 extends EffectArg<T>,
        T extends EffectTarget<TArg>
    >(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<BindEffectFn<TArg, TReturn>>
            | TypedPropertyDescriptor<BindEffectFn2<TArg, TArg2, TReturn>>
            | TypedPropertyDescriptor<BindEffectFn3<TArg, TArg2, TArg3, TReturn>>
            | TypedPropertyDescriptor<BindEffectFn4>,
    ): void
}

export interface AssignEffectDecorator<T extends object> {
    <
        TReturn extends AssignReturnType<T>,
        TArg extends EffectArg<T>,
        TArg2 extends EffectArg<T>,
        TArg3 extends EffectArg<T>,
        T extends EffectTarget<TArg>
    >(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<AssignEffectFn<TArg, TReturn>>
            | TypedPropertyDescriptor<AssignEffectFn2<TArg, TArg2, TReturn>>
            | TypedPropertyDescriptor<AssignEffectFn3<TArg, TArg2, TArg3, TReturn>>
            | TypedPropertyDescriptor<AssignEffectFn4<TReturn>>,
    ): void
}
