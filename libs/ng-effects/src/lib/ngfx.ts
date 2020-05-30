import {
    AbstractType,
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    DoCheck,
    InjectFlags,
    InjectionToken,
    Injector,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    Type,
    ɵmarkDirty as markDirty,
    ɵsetCurrentInjector as setCurrentInjector,
    ɵɵdirectiveInject as directiveInject,
    inject as rootInject,
} from "@angular/core"

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

let activeContext: Context = {}
let activePhase: Lifecycle | undefined

function getContext() {
    return activeContext
}

function setContext(context: Context) {
    activeContext = context
}

function getPhase() {
    return activePhase
}

function setPhase(phase?: Lifecycle) {
    activePhase = phase
}

let injectorDepth = 0
let previousInjector: undefined | null | Injector

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
    previousInjector = setCurrentInjector(undefined)
    setCurrentInjector(previousInjector)
    const injector =
        previousInjector ?? injectorDepth ? rootInject : directiveInject
    injectorDepth++
    const value = injector(token as any, flags)
    injectorDepth--
    return value
}

function runInContext<T, U extends any[]>(
    context: Context,
    phase: Lifecycle | undefined,
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

    watch(
        ref,
        (value) => {
            if (key === "activeTodo") {
                console.log("value", value)
            }
            previousValue = value
            Reflect.set(ctx, key, value)
            markDirty(ctx)
        },
        { flush: "sync" },
    )

    function checkRef() {
        const viewValue = Reflect.get(ctx, key)
        if (viewValue !== previousValue) {
            previousValue = viewValue
            ref.value = viewValue
        }
    }
    onCheck(checkRef)
    Reflect.set(ctx, key, previousValue)
}

class LinkedList<T extends object, U, V> {
    private list = new WeakMap<T, Map<U, Set<V>>>()
    set(key1: T, key2: U, value: V) {
        const first = this.list
        const second = first.get(key1) ?? first.set(key1, new Map()).get(key1)!
        const third = second.get(key2) ?? second.set(key2, new Set()).get(key2)!

        third.add(value)
    }
    get(key1: T, key2: U) {
        return this.list.get(key1)?.get(key2)
    }

    delete(key1: T, key2: U) {
        const set = this.list.get(key1)?.get(key2)
        if (set) {
            set.clear()
        }
    }
}

type Flush = "pre" | "post" | "sync"

export interface WatchEffectOptions {
    flush?: Flush
}

const hooks = new LinkedList<Context, Lifecycle | undefined, Function>()
const invalidators = new LinkedList<
    Context,
    Lifecycle | undefined,
    (stop: boolean) => void
>()
const invalidated = new LinkedList<Context, Flush, () => void>()
const deps = new LinkedList<object, PropertyKey, () => void>()

function attachHook(invalidate: Function, phase: Lifecycle) {
    const context = getContext()
    const currentPhase = getPhase()
    if (context && currentPhase === Lifecycle.OnConnect) {
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

function invalidate(phase?: Lifecycle) {
    const context = getContext()
    const list = invalidators.get(context, phase)
    const copy = new Set(list)
    if (list) {
        list.clear()
        for (const invalidate of copy) {
            invalidate(true)
        }
    }
}

function createInvalidator(
    factory: CreateEffect,
    options: WatchEffectOptions,
    context: Context,
    phase?: Lifecycle,
): [(force?: boolean) => void, OnInvalidate] {
    let running = true
    const teardowns = new Set<() => void>()
    const flush =
        previousInjector || injectorDepth ? "sync" : options.flush ?? "post"

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
        const currentPhase = getPhase()
        for (const teardown of teardowns) {
            teardown()
        }
        teardowns.clear()
        if (running) {
            if (done) {
                running = false
                invalidated.delete(context, flush)
                return
            }
            if (flush === "sync") {
                restart()
            } else {
                invalidated.set(context, flush, restart)
            }
            if (currentPhase === undefined) {
                runInContext(context, Lifecycle.OnCheck, runHook)
            }
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

function readValues(source: (Ref<any> | (() => any))[]) {
    return source.map(readValue)
}

function readValue(ref: any) {
    return typeof ref === "function" ? ref() : ref.value
}

type WatchValues<T> = {
    [key in keyof T]: T[key] extends () => infer R ? R : UnwrapRef<T[key]>
}

export function watch<
    T extends [Ref<any> | (() => any), ...(Ref<any> | (() => any))[]]
>(
    source: T,
    observer: (
        value: WatchValues<T>,
        previousValue: WatchValues<T>,
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: Ref<T> | (() => T),
    observer: (value: T, previousValue: T, onInvalidate: OnInvalidate) => void,
    options?: WatchEffectOptions,
): StopHandle
export function watch<T>(
    source: Ref<T> | (() => T) | (Ref<T> | (() => T))[],
    observer: (
        value: T | T[],
        previousValue: T | T[],
        onInvalidate: OnInvalidate,
    ) => void,
    options?: WatchEffectOptions,
): StopHandle {
    let stopped = true
    let stop
    let previousValue: any
    onDestroy(() => (stopped = true))
    if (Array.isArray(source)) {
        previousValue = readValues(source)
        stop = watchEffect((onInvalidate) => {
            const values = readValues(source)
            if (stopped) return
            observer(values, previousValue, onInvalidate)
            previousValue = values
        }, options)
    } else {
        previousValue = readValue(source)
        stop = watchEffect((onInvalidate) => {
            const value = readValue(source)
            if (stopped) return
            observer(value, previousValue, onInvalidate)
            previousValue = value
        }, options)
    }
    stopped = false
    return stop
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
                success = Reflect.set(previous, "value", toRaw(value))
            } else {
                success = Reflect.set(target, property, toRaw(value), receiver)
            }
            trigger(target, property)
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
    let trigger: any
    const ref = customRef((track, _trigger) => {
        trigger = _trigger
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
        trigger()
    }
    function useOptions() {
        value = getterOrOptions.get()
        trigger()
    }
    watchEffect(
        typeof getterOrOptions === "function" ? useGetter : useOptions,
        { flush: "sync" },
    )
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
    const ref = Object.create(Ref.prototype, {
        __REF__: {
            value: true,
        },
        value: factory(trackRef, triggerRef),
    })
    function trackRef() {
        track(ref, "value")
    }
    function triggerRef() {
        trigger(ref, "value")
    }
    return ref
}

export type UnwrapRef<T> = T extends Ref<infer R> ? R : T

export type UnwrapRefs<T extends unknown> = {
    [key in keyof T]: UnwrapRef<T[key]>
}

export interface LifecycleHooks {
    ngOnChanges(changes: SimpleChanges): void
    ngOnInit(): void
    ngDoCheck(): void
    ngAfterContentInit(): void
    ngAfterContentChecked(): void
    ngAfterViewInit(): void
    ngAfterViewChecked(): void
    ngOnDestroy(): void
}

export function fx<T extends object>(
    factory: () => T,
): new () => LifecycleHooks & UnwrapRefs<T>
export function fx(factory: () => void): new () => LifecycleHooks
export function fx<T extends object>(
    factory: () => T | void,
): new () => unknown {
    return class
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
}
