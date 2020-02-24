import { ChangeDetectorRef } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"
import { EffectMetadata } from "../interfaces"
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

export type NextValue<T extends any> = T["next"] extends (value: infer R, ...args: any[]) => any
    ? R
    : never

export type NextOptions<T extends any> = T["next"] extends (
    value: any,
    options: EffectMetadata<infer R>,
    ...args: any[]
) => any
    ? R
    : never

export interface EffectFn<TReturn, T extends EffectArg<any>, X extends TReturn> {
    (state: T): X
}

export interface EffectFn2<TReturn, T extends EffectArg<any>, U extends EffectArg<any>, X extends TReturn> {
    (state: T, context: U): EffectTarget<T> extends EffectTarget<U> ? TReturn : never
}

export interface EffectFn3<
    TReturn,
    T extends EffectArg<any>,
    U extends EffectArg<any>,
    V extends EffectArg<any>, X extends TReturn
> {
    (state: T, context: U, observer: V): EffectTarget<T> extends EffectTarget<U | V>
        ? X
        : never
}

export interface EffectFn4<TReturn extends any> {
    (): TReturn
}

export interface BindEffectFn<T extends any, TKey> {
    (state: T): BindReturnType<EffectTarget<T>, TKey>
}

export interface BindEffectFn2<T extends any, U extends any, TKey> {
    (state: T, context: U): BindReturnType<EffectTarget<T | U>, TKey>
}

export interface BindEffectFn3<T extends any, U extends any, V extends any, TKey> {
    (state: T, context: U, observer: V): BindReturnType<EffectTarget<T | U | V>, TKey>
}

export interface AssignEffectFn<T extends any, U extends EffectArg<T>> {
    (state: U): AssignReturnType<T | EffectTarget<U>>
}

export interface AssignEffectFn2<T extends any, U extends EffectArg<T>, V extends EffectArg<T>> {
    (state: U, context: V): AssignReturnType<T | EffectTarget<U | V>>
}

export interface AssignEffectFn3<
    T extends any,
    U extends EffectArg<T>,
    V extends EffectArg<T>,
    W extends EffectArg<T>
> {
    (state: U, context: V, observer: W): AssignReturnType<T | EffectTarget<U | V | W>>
}

export interface AssignEffectFn4<T extends any, TForce> {
    (): AssignReturnType<T | TForce>
}

export type EffectArg<T> = State<T> | Context<T> | Observable<T>
export type EffectTarget<T> = T extends EffectArg<infer R> ? R : never
export type BindReturnType<T, TKey> = TKey extends keyof T ? Observable<T[TKey]> : never
export type AssignReturnType<T> = Observable<T>

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
            | TypedPropertyDescriptor<EffectFn3<T, U, V, W, X>>,
    ): void
}

export interface BindEffectDecorator<TKey> {
    <T extends object, U extends object, V extends object>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<BindEffectFn<T, TKey>>
            | TypedPropertyDescriptor<BindEffectFn2<T, U, TKey>>
            | TypedPropertyDescriptor<BindEffectFn3<T, U, V, TKey>>,
    ): void
}

export interface AssignEffectDecorator<T extends object> {
    <U extends any, V extends any, W extends any, X>(
        target: any,
        prop: PropertyKey,
        propertyDescriptor:
            | TypedPropertyDescriptor<AssignEffectFn<X, U>>
            | TypedPropertyDescriptor<AssignEffectFn2<X, U, V>>
            | TypedPropertyDescriptor<AssignEffectFn3<X, U, V, W>>
            | TypedPropertyDescriptor<AssignEffectFn4<X, T>>,
    ): void
}
