import {
    AbstractType,
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    DoCheck,
    EventEmitter,
    InjectFlags,
    InjectionToken,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    Type,
    ɵmarkDirty as markDirty,
    ɵɵdirectiveInject as directiveInject,
} from "@angular/core"
import { Observable, OperatorFunction } from "rxjs"

interface Context {}
export type CreateEffect = (onInvalidate: OnInvalidate) => void
export interface OnInvalidate {
    (teardown: () => void): void
}

export type ImmutablePrimitive =
    | undefined
    | null
    | boolean
    | string
    | number
    | Function

export type Immutable<T> = T extends ImmutablePrimitive
    ? T
    : T extends Array<infer U>
    ? ImmutableArray<U>
    : T extends Map<infer K, infer V>
    ? ImmutableMap<K, V>
    : T extends Set<infer M>
    ? ImmutableSet<M>
    : ImmutableObject<T>

export type ImmutableArray<T> = ReadonlyArray<Immutable<T>>
export type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>
export type ImmutableSet<T> = ReadonlySet<Immutable<T>>
export type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> }

export interface ReactiveOptions {
    shallow?: boolean
}

const enum Lifecycle {
    OnConnect,
    OnChanges,
    OnInit,
    OnCheck,
    OnContentInit,
    OnContentChecked,
    OnViewInit,
    OnViewChecked,
    OnDestroy,
}

let activeContext: Context
let activePhase: Lifecycle

function getContext() {
    return activeContext
}

function setContext(context: Context) {
    activeContext = context
}

function getPhase() {
    return activePhase
}

function setPhase(phase: Lifecycle) {
    activePhase = phase
}

export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
): T
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags,
): T | null
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags = InjectFlags.Default,
): unknown {
    return directiveInject(token as any, flags)
}

function runInContext<T, U extends any[]>(
    context: Context,
    phase: Lifecycle,
    run: (...args: U) => T,
    ...args: U
): T {
    let result,
        previousContext = getContext(),
        previousPhase = getPhase()
    setContext(context)
    setPhase(phase)
    result = run(...args)
    setContext(previousContext)
    setPhase(previousPhase)
    return result
}

export class Ref<T> {
    readonly __REF__ = true
    public value: T
    constructor(value?: T, shallow = false) {
        this.value = unref(value) as T
        return reactiveFactory(this, { shallow }) as any
    }
}

type ReadonlyRef<T> = Readonly<Ref<Readonly<T>>>

export function shallowRef<T>(): Ref<T | undefined>
export function shallowRef<T extends Ref<any>>(value: T): Ref<UnwrapRefs<T>>
export function shallowRef<T>(value: T): Ref<T>
export function shallowRef(value?: unknown): Ref<unknown> {
    return new Ref(value, true)
}

export function ref<T>(): Ref<T | undefined>
export function ref<T extends Ref<any>>(value: T): Ref<UnwrapRefs<T>>
export function ref<T>(value: T): Ref<T>
export function ref(value?: unknown): Ref<unknown> {
    return new Ref(value)
}

export function isRef(value: any): value is Ref<any> {
    return value instanceof Ref
}

export function unref<T>(ref: Ref<T> | T): T {
    return isRef(ref) ? ref.value : ref
}

export function toRef<T extends object, U extends keyof T>(
    obj: T,
    key: U,
): Ref<T[U]> {
    return customRef((track, trigger) => {
        return {
            get() {
                track()
                return obj[key]
            },
            set(val) {
                obj[key] = val
                trigger()
            },
        }
    })
}

export type RefMap<T> = {
    [key in keyof T]: Ref<T>
}

export function toRefs<T extends object>(obj: T): RefMap<T> {
    const map: any = {}
    for (const key of Object.keys(obj) as any[]) {
        map[key] = toRef(unref(obj), key)
    }
    return map
}

function bindRef(ctx: Context, key: PropertyKey, ref: any) {
    let previousValue = ref.value
    function checkRef() {
        const refValue = ref.value
        const viewValue = Reflect.get(ctx, key)
        if (refValue !== previousValue) {
            Reflect.set(ctx, key, refValue)
            previousValue = refValue
            markDirty(ctx)
        } else if (viewValue !== previousValue) {
            ref.value = viewValue
            previousValue = viewValue
        }
    }
    onCheck(checkRef)
    Reflect.set(ctx, key, previousValue)
}

class WeakTriplet<T extends object, U, V> {
    private triple = new WeakMap<T, Map<U, Set<V>>>()
    set(key1: T, key2: U, value: V) {
        const first = this.triple
        const second = first.get(key1) ?? first.set(key1, new Map()).get(key1)!
        const third = second.get(key2) ?? second.set(key2, new Set()).get(key2)!

        third.add(value)
    }
    get(key1: T, key2: U) {
        return this.triple.get(key1)?.get(key2)
    }

    delete(key1: T, key2: U) {
        const set = this.triple.get(key1)?.get(key2)
        if (set) {
            set.clear()
        }
    }
}

type Flush = "pre" | "post" | "sync"

export interface WatchEffectOptions {
    flush?: Flush
}

const hooks = new WeakTriplet<Context, Lifecycle, Function>()
const invalidators = new WeakTriplet<Context, Lifecycle, () => void>()
const invalidated = new WeakTriplet<Context, Flush, () => void>()
const deps = new WeakTriplet<object, PropertyKey, () => void>()

function attachHook(invalidate: Function, phase: Lifecycle) {
    const context = getContext()
    if (context) {
        hooks.set(getContext(), phase, invalidate)
    }
}

export function onCheck(fn: () => void) {
    attachHook(fn, Lifecycle.OnCheck)
}

export function onInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnInit)
}

export function onChanges(fn: (changes: SimpleChanges) => void) {
    attachHook(fn, Lifecycle.OnChanges)
}

export function onContentInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnContentInit)
}

export function onContentChecked(fn: () => void) {
    attachHook(fn, Lifecycle.OnContentChecked)
}

export function onViewInit(fn: () => void) {
    attachHook(fn, Lifecycle.OnViewInit)
}

export function onViewChecked(fn: () => void) {
    attachHook(fn, Lifecycle.OnViewChecked)
}

export function onDestroy(fn: () => any) {
    attachHook(fn, Lifecycle.OnDestroy)
}

function flush(timing: "pre" | "post" | "sync") {
    const context = getContext()
    const list = invalidated.get(context, timing)
    if (list) {
        for (const restart of list) {
            restart()
        }
        list.clear()
    }
}

function invalidate(phase: Lifecycle) {
    const context = getContext()
    const list = invalidators.get(context, phase)
    if (list) {
        for (const invalidate of list) {
            invalidate()
        }
        list.clear()
    }
}

function createInvalidator(
    factory: CreateEffect,
    options: WatchEffectOptions,
    context: Context,
    phase: Lifecycle,
): [(force?: boolean) => void, OnInvalidate] {
    const teardowns = new Set<() => void>()
    let running = true

    onDestroy(() => stop(true))

    function restart() {
        if (running) {
            runEffect(factory, onInvalidate, stop)
        }
        return running
    }

    function onInvalidate(teardown: () => void): void {
        teardowns.add(teardown)
    }

    function stop(done = false) {
        for (const teardown of teardowns) {
            teardown()
        }
        teardowns.clear()
        if (!running) {
            return
        }
        const currentPhase = getPhase()
        if (done) {
            running = false
            invalidated.delete(context, options.flush ?? "post")
            return
        }
        if (options.flush === "sync" && currentPhase !== Lifecycle.OnDestroy) {
            restart()
        } else {
            invalidated.set(context, options.flush ?? "post", restart)
        }
        if (currentPhase === undefined && running) {
            runInContext(context, Lifecycle.OnCheck, runHook)
            markDirty(context)
        }
    }

    invalidators.set(context, phase, stop)

    return [stop, onInvalidate]
}

function runEffect(
    factory: CreateEffect,
    onInvalidate: OnInvalidate,
    stop: () => void,
) {
    const previous = activeEffect
    activeEffect = stop
    factory(onInvalidate)
    activeEffect = previous
}

type StopHandle = () => void

export function createEffect(
    factory: CreateEffect,
    options: WatchEffectOptions = {},
): StopHandle {
    const context = getContext()
    const phase = getPhase()
    const [stop, onInvalidate] = createInvalidator(
        factory,
        options,
        context,
        phase,
    )
    runEffect(factory, onInvalidate, stop)
    return function stopHandler() {
        stop(true)
    }
}

export function watchEffect(
    factory: CreateEffect,
    options?: WatchEffectOptions,
) {
    return createEffect(factory, options)
}

export function watch<T extends [Ref<any>, ...Ref<any>[]]>(
    source: T,
    observer: (
        value: UnwrapRefs<T>,
        previousValue: UnwrapRefs<T>,
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: Ref<T>,
    observer: (value: T, previousValue: T, onInvalidate: OnInvalidate) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: Ref<T> | Ref<T>[],
    observer: (
        value: T | T[],
        previousValue: T | T[],
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle {
    let stopped = false
    onDestroy(() => (stopped = true))
    if (Array.isArray(source)) {
        return watchEffect((onInvalidate) => {
            const previousValues = source.map((v) => v.value)
            onInvalidate(() => {
                if (stopped) return
                const values = source.map((v) => v.value)
                observer(values, previousValues, onInvalidate)
            })
        }, options)
    } else {
        return watchEffect((onInvalidate) => {
            const previousValue = source.value
            onInvalidate(() => {
                if (stopped) return
                const value = source.value
                observer(value, previousValue, onInvalidate)
            })
        }, options)
    }
}

function assign(context: Context, partial: object | void): void {
    if (!partial) {
        return
    }
    if (isProxy(partial)) {
        return assign(context, toRefs(partial))
    }
    for (const [key, ref] of Object.entries(partial)) {
        if (ref instanceof Ref) {
            bindRef(context, key, ref)
        } else {
            Reflect.set(context, key, ref)
        }
    }
}

function setup<T>(factory: () => Partial<T> | void) {
    assign(getContext(), factory())
}

function runHook(changes?: SimpleChanges) {
    const ctx = getContext()
    const phase = getPhase()
    const fns = hooks.get(ctx, phase)
    if (!hooks) {
        return
    }
    invalidate(phase)
    switch (phase) {
        case Lifecycle.OnCheck:
            flush("pre")
            break
        case Lifecycle.OnViewChecked:
            flush("post")
            break
    }
    for (const fn of fns ?? []) {
        fn(changes)
    }
}

const proxyRefs = new WeakMap()

function isObject(value: any): value is object {
    return typeof value === "object" && value !== null
}

let activeEffect: (() => void) | undefined

function track(target: Context, key: PropertyKey) {
    if (activeEffect) {
        deps.set(target, key, activeEffect)
    }
}

function trigger(target: Context, key: PropertyKey) {
    const invalidations = deps.get(target, key)
    // copy current deps so we don't invalidate new `sync` effects
    const copy = new Set(invalidations)
    if (invalidations) {
        invalidations.clear()
        for (const invalidate of copy) {
            invalidate()
        }
    }
}

function reactiveFactory<T extends object>(
    value: T,
    options: ReactiveOptions = {},
): UnwrapRefs<T> {
    if (proxyRefs.has(value)) {
        return proxyRefs.get(value)
    }
    const proxy = new Proxy(toRaw(value), {
        get(target: any, property: any, receiver: any) {
            if (property === PROXY) {
                return target
            }
            const descriptor = Reflect.getOwnPropertyDescriptor(
                target,
                property,
            )
            const value = unref(
                descriptor
                    ? Reflect.get(target, property, receiver)
                    : target[property],
            )
            if (descriptor?.enumerable) {
                track(target, property)
            }
            if (proxyRefs.has(value)) {
                return proxyRefs.get(value)
            }
            if (isObject(value) || typeof value === "function") {
                if (options.shallow) {
                    return value
                }
                return reactiveFactory(value, options)
            }
            return value
        },
        set(target, property, value, receiver) {
            const previous = Reflect.get(target, property, receiver)
            let success
            if (previous instanceof Ref) {
                success = Reflect.set(previous, "value", value)
            } else {
                success = Reflect.set(target, property, value, receiver)
            }
            if (previous !== value) {
                trigger(target, property)
            }
            proxyRefs.delete(previous)
            return success
        },
        apply(target: any, thisArg: any, argArray?: any): any {
            return target.apply(toRaw(thisArg), argArray)
        },
        has(target: T, property: PropertyKey) {
            if (property === PROXY) {
                return true
            }
            return Reflect.has(target, property)
        },
    })
    proxyRefs.set(value, proxy)
    return proxy as any
}

export function reactive<T extends object>(value: T) {
    return reactiveFactory(value)
}

export function shallowReactive<T extends object>(value: T) {
    return reactiveFactory(value, { shallow: true })
}

export function readonly<T extends { [key: string]: any }>(
    value: T,
): ImmutableObject<T> {
    return reactiveFactory(value) as any
}

export function shallowReadonly<T extends { [key: string]: any }>(
    value: T,
): Readonly<T> {
    return reactiveFactory(value, { shallow: true })
}

export function computed<T>(options: {
    get: () => T
    set: (val: T) => void
}): Ref<T>
export function computed<T>(getter: () => T): ReadonlyRef<T>
export function computed(getterOrOptions: any): Ref<any> {
    let value: any
    const ref = customRef((track, trigger) => {
        return {
            get() {
                track()
                return value
            },
            set(val) {
                value = getterOrOptions.set(val)
                trigger()
            },
        }
    })
    function useGetter() {
        value = getterOrOptions()
    }
    function useOptions() {
        value = getterOrOptions.get()
    }
    watchEffect(
        typeof getterOrOptions === "function" ? useGetter : useOptions,
        { flush: "sync" },
    )
    Object.defineProperty(ref, "computed", {
        value: true,
    })
    return ref
}

const PROXY = Symbol()

export function toRaw<T extends object>(value: T): T {
    return isProxy(value) ? Reflect.get(value, PROXY) : value
}

export function isProxy<T extends object>(value: T): boolean {
    return isObject(value) && Reflect.has(value, PROXY)
}

type CustomRefFactory<T> = (
    track: () => void,
    trigger: () => void,
) => {
    get: () => T
    set: (value: T) => void
}

export function customRef<T>(factory: CustomRefFactory<T>): Ref<T> {
    const ref = shallowRef()
    function trackRef() {
        track(ref, "value")
    }
    function triggerRef() {
        trigger(ref, "value")
    }
    Reflect.defineProperty(ref, "value", factory(trackRef, triggerRef))
    return ref as Ref<T>
}

export type UnwrapRef<T> = T extends ActionCreator<infer A>
    ? ActionCreator<A>
    : T extends Ref<infer R>
    ? R
    : T

export type UnwrapRefs<T extends unknown> = {
    [key in keyof T]: UnwrapRef<T[key]>
}

export type ActionRef<T, U = T> = ActionCreator<T> & {
    readonly __REF__: true
    readonly value: U
}

export interface ActionBuilder<T, U = T, V = T>
    extends Iterator<ActionRef<T, V>> {}

export function action<T = void>(): ActionBuilder<T> {
    return new ActionBuilder<T>()
}

function filter(fn: (value: any) => boolean) {
    return function (value: any) {
        if (fn(value)) {
            return value
        } else {
            return REJECTED
        }
    }
}

const REJECTED = Symbol()

interface ActionCreator<T> {
    readonly __ACTION_REF__: true
    (arg: T): void
}

export class ActionBuilder<T, U = T, V = T> {
    *[Symbol.iterator](): Iterator<ActionRef<T, V>> {
        const ops = this.ops
        const ref = event()
        function action(value?: any) {
            for (const op of ops) {
                value = op(value)
                if (value === REJECTED) {
                    return
                }
            }
            ref.value = value
        }

        Object.defineProperty(action, "value", {
            get(): any {
                return ref.value
            },
        })

        yield action as any
    }

    constructor(public ops: any[] = []) {}

    map<W, X extends V>(fn: (arg: X) => W): ActionBuilder<T, U, W> {
        return new ActionBuilder(this.ops.concat(fn))
    }

    filter<S extends V>(fn: (value: V) => value is S): ActionBuilder<T, U, S>
    filter(fn: (value: V) => boolean): ActionBuilder<T, U, V>
    filter(fn: (value: V) => boolean): ActionBuilder<T, U, V> {
        return new ActionBuilder(this.ops.concat(filter(fn)))
    }
}

function event() {
    return customRef((track, trigger) => {
        let value: any
        return {
            get() {
                track()
                return value
            },
            set(val) {
                value = val
                trigger()
            },
        }
    })
}

class Effect<T> extends EventEmitter<T> {
    private action: Ref<T> | Observable<T>

    constructor(action: Ref<T> | Observable<T>, isAsync = true) {
        super(isAsync)
        this.action = action
        onDestroy(() => this.complete())
    }

    // prettier-ignore
    run(): [ActionRef<T>, ActionRef<any>, ActionRef<any>]
    // prettier-ignore
    run<A>(op1: OperatorFunction<T, A>): [ActionRef<A>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): [ActionRef<B>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): [ActionRef<C>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): [ActionRef<D>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): [ActionRef<E>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): [ActionRef<F>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): [ActionRef<G>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): [ActionRef<H>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): [ActionRef<I>, ActionRef<any>, ActionRef<void>]
    // prettier-ignore
    run<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): [ActionRef<{}>, ActionRef<any>, ActionRef<void>]
    run(...operators: any[]): any {
        const subject = this
        const source = (<any>subject.pipe)(...operators)
        const [onNext] = action<any>()
        const [onError] = action<any>()
        const [onComplete] = action()

        subscribe()

        if ("subscribe" in this.action) {
            this.action.subscribe(subject)
        } else {
            watch(this.action, (value) => {
                subject.emit(value)
            })
        }

        function next(value: any) {
            onNext(value)
        }

        function error(err: any) {
            onError(err)
            if (!subject.isStopped) subscribe()
        }

        function complete() {
            onComplete()
            if (!subject.isStopped) subscribe()
        }

        function subscribe() {
            source.subscribe({
                next,
                error,
                complete,
            })
        }

        return [onNext, onError, onComplete]
    }
}

export function effect<T>(
    ref: Ref<T> | Observable<T>,
    isAsync = true,
): Effect<T> {
    return new Effect(ref, isAsync)
}

export function Fx<T extends object>(factory: () => T): new () => UnwrapRefs<T>
export function Fx(factory: () => void): new () => {}
export function Fx<T extends object>(
    factory: () => T | void,
): new () => unknown {
    class Fx
        implements
            OnChanges,
            OnInit,
            DoCheck,
            AfterContentInit,
            AfterContentChecked,
            AfterViewInit,
            AfterViewChecked,
            OnDestroy {
        constructor() {
            runInContext(this, Lifecycle.OnConnect, setup, factory)
        }
        ngOnChanges(changes: SimpleChanges) {
            runInContext(this, Lifecycle.OnChanges, runHook, changes)
        }
        ngOnInit() {
            runInContext(this, Lifecycle.OnInit, runHook)
        }
        ngDoCheck() {
            runInContext(this, Lifecycle.OnCheck, runHook)
        }
        ngAfterContentInit() {
            runInContext(this, Lifecycle.OnContentInit, runHook)
        }
        ngAfterContentChecked() {
            runInContext(this, Lifecycle.OnContentChecked, runHook)
        }
        ngAfterViewInit() {
            runInContext(this, Lifecycle.OnViewInit, runHook)
        }
        ngAfterViewChecked() {
            runInContext(this, Lifecycle.OnViewChecked, runHook)
        }
        ngOnDestroy() {
            runInContext(this, Lifecycle.OnDestroy, runHook)
        }
    }
    return Fx as new () => UnwrapRefs<any>
}
