import {
    AbstractType,
    ChangeDetectorRef,
    inject as oinject,
    InjectFlags,
    InjectionToken,
    Injector,
    IterableDiffer,
    IterableDiffers,
    KeyValueDiffer,
    QueryList,
    SimpleChanges,
    Type,
    ViewContainerRef,
} from "@angular/core"
import {
    EffectHook,
    CreateEffectOptions,
    LifecycleHook,
    OnInvalidate,
    Teardown,
} from "./interfaces"
import { Subject } from "rxjs"
import { getLifecycleHook, setLifecycleHook } from "./lifecycle"

type CleanupMap = Map<LifecycleHook, Set<Teardown>>

const injectorMap = new WeakMap<Context, Injector>()
const cleanupMap = new WeakMap<Context, CleanupMap>()
const effects = new Map<EffectHook, CreateEffectOptions>()
const hooksMap = new WeakMap<Context, Map<LifecycleHook, Set<EffectHook>>>()
const schedulerMap = new WeakMap<Context, Subject<LifecycleHook | undefined>>()

let activeContext: undefined | Context

export const CONNECTABLE = new InjectionToken<ConnectableFunction[]>(
    "CONNECTABLE",
)

export function throwMissingInjectorError(): never {
    throw new Error("[ngfx] Injector not found.")
}

export function throwMissingContextError(): never {
    throw new Error("[ngfx] Invalid execution context")
}

const globalInjector = {
    get<T>(
        token: Type<T> | AbstractType<T> | InjectionToken<T>,
        notFoundValue?: T,
        flags: InjectFlags = InjectFlags.Default,
    ) {
        return runInContext(undefined, undefined, () => {
            const value = oinject(token as any, flags)
            return value === null && Boolean(flags & InjectFlags.Optional)
                ? notFoundValue
                : value
        })
    },
}

export function getInjector(): Injector {
    if (activeContext) {
        const injector = injectorMap.get(getContext())
        if (injector) {
            return injector
        }
        throwMissingInjectorError()
    } else {
        return globalInjector
    }
}

export function getContext<T extends object>(): T {
    if (activeContext) {
        return activeContext as T
    } else {
        throwMissingContextError()
    }
}

export function toRaw<T extends object>(value: T): T {
    return Reflect.get(value, targetSymbol) || value
}

export function schedule(
    lifecycle: LifecycleHook,
    source: Context = getContext(),
) {
    const context = toRaw(source)
    runInContext(context, lifecycle, () =>
        getScheduler(context).next(lifecycle),
    )
}

export function getScheduler(
    context = getContext(),
): Subject<LifecycleHook | undefined> {
    return (
        schedulerMap.get(context) ||
        schedulerMap.set(context, new Subject()).get(context)!
    )
}

export type Context = { [key: string]: any }

export function setContext(context?: any) {
    activeContext = context
}

export interface FactoryType<T> extends Function {
    (): T
}

export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags,
): T | null
export function inject<T>(token: FactoryType<T>): T
export function inject<T>(token: FactoryType<T>, flags: InjectFlags,): T | null
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
): T
export function inject(tokenOrDeps: any, flagsOrFn?: any): unknown {
    const injector = getInjector()
    const optional =
        flagsOrFn && Boolean(flagsOrFn & InjectFlags.Optional)
            ? null
            : undefined
    // Workaround for https://github.com/angular/angular/issues/31776
    if (flagsOrFn) {
        let parent: Injector
        if (
            Boolean(flagsOrFn & InjectFlags.SkipSelf) ||
            Boolean(flagsOrFn & InjectFlags.Self)
        ) {
            try {
                parent = injector.get(ViewContainerRef as Type<any>)
                    ?.parentInjector
            } catch {
                throw new Error(
                    "This injector is a temporary workaround that can only be used inside a `connectable()` or " +
                        "`ngOnConnect()` call. For other injection contexts, please import `inject()` from @angular/core." +
                        " Related issue: https://github.com/angular/angular/issues/31776",
                )
            }
            if (Boolean(flagsOrFn & InjectFlags.SkipSelf) && parent) {
                return parent.get(tokenOrDeps, optional)
            }
            if (Boolean(flagsOrFn & InjectFlags.Self)) {
                const current = injector.get(tokenOrDeps as any, null)
                const parentExists = parent
                    ? parent.get(tokenOrDeps, null)
                    : null
                if (optional === null && parentExists === current) {
                    return null
                }
                if (parentExists === null || parentExists !== current) {
                    return current
                } else {
                    throw new Error(
                        `EXCEPTION: No provider for ${
                            "name" in tokenOrDeps
                                ? tokenOrDeps.name
                                : tokenOrDeps.toString()
                        }`,
                    )
                }
            }
        }
    }
    try {
        return injector.get(tokenOrDeps, optional, flagsOrFn)
    } catch (e) {
        if (optional === null) {
            return optional
        } else {
            throw e
        }
    }
}

export function getHooks() {
    return hooksMap.get(getContext())!
}

export function flush(cleanup: Set<Teardown>) {
    for (const teardown of cleanup) {
        unsubscribe(teardown)
    }
    cleanup.clear()
}

const invalidationsMap = new WeakMap<
    Context,
    Map<Function, [Function, () => boolean, CreateEffectOptions]>
>()

function getInvalidations(context: Context) {
    return (
        invalidationsMap.get(context) ||
        invalidationsMap.set(context, new Map()).get(context)!
    )
}

export function getValues(deps: Map<any, Set<any>>): any[] {
    const current: any[] = []
    Array.from(deps).map(([context, keys]) => {
        Array.from(keys).map((key) => {
            current.push(context[key])
        })
    })
    return current
}

export function invalidateEffects(
    target: Context,
    flush?: "pre" | "post" | "sync",
) {
    const invalidations = getInvalidations(target)
    const effectsToRun = new Set<Function>()
    for (const [invalidate, detectChanges, opts] of invalidations.values()) {
        if (!flush || (opts.flush === flush && detectChanges())) {
            effectsToRun.add(invalidate())
        }
    }
    if (flush) {
        for (const effect of effectsToRun) {
            effect()
        }
    }
    effectsToRun.clear()
}

export function stopEffect(context: Context, effect: Function) {
    const [invalidate] = getInvalidations(context).get(effect) || []
    if (invalidate) {
        invalidate()
    }
}

export function runEffect(
    context: Context,
    effect: EffectHook,
    config: CreateEffectOptions,
    cleanup: Set<Teardown>,
    differs: IterableDiffers,
) {
    const invalidations = getInvalidations(context)
    const [flushedDeps, teardown] = runWithDeps(effect)

    effects.delete(effect)

    const invalidation = () => {
        config.invalidate()
        cleanup.delete(invalidation)
        invalidations.delete(effect)
        unsubscribe(teardown)
        return function () {
            runEffect(context, effect, config, cleanup, differs)
        }
    }

    if (config.watch) {
        function detectChanges() {
            return hasChanges(differ, getValues(deps))
        }
        const deps = config.watch ? flushedDeps : new Map()
        const differ = differs.find([]).create()
        differ.diff(getValues(deps))
        invalidations.set(effect, [invalidation, detectChanges, config])
    }

    cleanup.add(invalidation)
}

export function runEffects(
    context: Context,
    cleanup: Set<Teardown>,
    differs: IterableDiffers,
) {
    for (const [effect, options] of effects) {
        runEffect(context, effect, options, cleanup, differs)
    }
}

let activeChanges: any

export function getOrSetChanges(simpleChanges?: SimpleChanges) {
    const isOnChanges = getLifecycleHook() === LifecycleHook.OnChanges
    if (arguments.length === 1) {
        activeChanges = simpleChanges
    }
    return isOnChanges ? activeChanges : undefined
}

export function runHooks(
    lifecycle: LifecycleHook,
    hooks: Set<EffectHook>,
    cleanup: Set<Teardown>,
) {
    const scheduler = getScheduler()
    const context = getContext()
    const differs = inject(IterableDiffers)

    scheduler.subscribe({
        next: (current) => {
            if (current === lifecycle) {
                flush(cleanup)
                for (const hook of hooks) {
                    runInContext(context, lifecycle, () => {
                        const teardown = hook(getOrSetChanges())
                        cleanup.add(teardown)
                        runEffects(context, cleanup, differs)
                    })
                }
            }
        },
        error: (error) => {
            flush(cleanup)
            console.error(error)
        },
        complete: () => flush(cleanup),
    })
}

export async function unsubscribe(teardown: Teardown) {
    if (typeof teardown === "function") {
        try {
            await teardown()
        } catch (e) {
            console.error(e)
        }
    } else if (teardown && "unsubscribe" in teardown) {
        teardown.unsubscribe()
    }
}

export function noop() {}

export const targetSymbol = Symbol()

export function hasChanges(
    differ: IterableDiffer<any> | KeyValueDiffer<any, any>,
    context: any,
): boolean {
    return differ.diff(Reflect.get(context, targetSymbol) || context) !== null
}

export function runScheduler() {
    const scheduler = getScheduler()
    const context: { [key: string]: any } = getContext()
    const changeDetectorRef = inject(
        ChangeDetectorRef as Type<ChangeDetectorRef>,
        InjectFlags.Optional,
    )
    let doCheck = false

    scheduler.subscribe((lifecycle) => {
        switch (lifecycle) {
            case LifecycleHook.DoCheck: {
                invalidateEffects(context, "sync")
                changeDetectorRef?.markForCheck()
                doCheck = true
                break
            }
            case LifecycleHook.AfterContentChecked: {
                if (doCheck) {
                    invalidateEffects(context, "pre")
                }
                break
            }
            case LifecycleHook.AfterViewChecked: {
                if (doCheck) {
                    invalidateEffects(context, "post")
                    doCheck = false
                }
                break
            }
            case LifecycleHook.OnDestroy: {
                invalidateEffects(context)
                scheduler.complete()
            }
        }
    })

    schedule(LifecycleHook.OnInit)
}

export function createSetup(context: Context) {
    return function () {
        setup(context)
    }
}

export function setup(context: Context) {
    const initializers = inject(
        CONNECTABLE,
        InjectFlags.Self | InjectFlags.Optional,
    )
    const raw = toRaw(context)
    const cleanup = cleanupMap.get(raw) as Map<LifecycleHook, Set<Teardown>>
    const refs = toRefs(context)

    if (context.ngOnConnect) {
        const xtd = context.ngOnConnect(context, refs)
        if (xtd) {
            Object.assign(raw, xtd)
        }
    }

    if (initializers) {
        for (const initializer of initializers) {
            initializer(context, refs)
        }
    }

    addHook(noop, LifecycleHook.OnInit)

    const hooksMap = getHooks()

    for (const [lifecycle, hooks] of hooksMap!) {
        runHooks(lifecycle, hooks, cleanup.get(lifecycle)!)
    }

    runScheduler()
}

export function runInContext<T extends (...args: any[]) => any>(
    context: any,
    lifecycle: LifecycleHook | undefined,
    func: T,
): ReturnType<T> {
    const prevContext = activeContext
    const prevLifecycle = getLifecycleHook()
    setContext(context)
    setLifecycleHook(lifecycle)
    const returnValue = func()
    setContext(prevContext)
    setLifecycleHook(prevLifecycle)
    return returnValue
}

export function connect<T extends object>(context: T, injector: Injector): T {
    const reactive = reactiveFactory<T>(context, context, {
        shallow: true,
    })
    const cleanup = new Map()
    const lifecycle = new Map()

    injectorMap.set(context, {
        get<T>(
            token: Type<T> | InjectionToken<T> | AbstractType<T>,
            notFoundValue?: T,
            flags?: InjectFlags,
        ) {
            return runInContext(undefined, undefined, () =>
                injector.get(token, notFoundValue, flags),
            )
        },
    })
    hooksMap.set(context, lifecycle)
    cleanupMap.set(context, cleanup)

    for (const index of Array.from({ length: 9 }).keys()) {
        cleanup.set(index, new Set<Teardown>())
        lifecycle.set(index, new Set<EffectHook>())
    }

    setContext(context)
    setLifecycleHook(LifecycleHook.OnConnect)

    return reactive
}

export function init(source: any) {
    const context = toRaw(source)
    const hostInjector = getInjector()
    const injector = Injector.create({
        parent: hostInjector,
        providers: [
            {
                provide: setup,
                useFactory: createSetup(source),
                deps: [],
            },
        ],
    })

    setContext()
    setLifecycleHook()
    runInContext(context, LifecycleHook.OnInit, () => injector.get(setup))

    if (activeChanges) {
        changes(context, activeChanges)
        getOrSetChanges(undefined)
    }
}

export function createEffect(
    factory: (onInvalidate: OnInvalidate) => Teardown,
    opts?: { watch?: boolean; flush: "pre" | "post" | "sync" },
) {
    const context = getContext()
    const invalidations = new Set<Teardown>()
    const effect = () => factory(onInvalidate)

    function onInvalidate(teardown: Teardown) {
        invalidations.add(teardown)
    }

    function invalidate() {
        for (const invalidation of invalidations) {
            unsubscribe(invalidation)
        }
        invalidations.clear()
    }

    addEffect(effect, {
        ...opts,
        invalidate,
    })
    onDestroy(invalidate)

    return function stop() {
        stopEffect(context, effect)
    }
}

export function addEffect(fn: EffectHook, options: CreateEffectOptions) {
    if (getLifecycleHook()) {
        effects.set(fn, options)
    } else {
        throw new Error("Effects cannot be used here")
    }
}

export function addHook(fn: EffectHook, lifecycle: LifecycleHook) {
    hooksMap.get(getContext())?.get(lifecycle)?.add(fn)
}

export let depsMap: Map<{ [key: string]: any }, Set<string | number>>

export function getDeps(object: object) {
    return depsMap.get(object) || depsMap.set(object, new Set()).get(object)!
}

export function runWithDeps(fn: Function): [typeof depsMap, any] {
    const previousDeps = depsMap
    const deps = new Map()
    depsMap = deps
    const value = fn()
    depsMap = previousDeps
    return [deps, value]
}

export function addDeps(object: Context, key: any) {
    if (depsMap) {
        getDeps(object).add(key)
    }
}

const cache = new WeakMap()

export function reactiveFactory<T extends object>(
    context: any,
    source: T,
    opts: { shallow?: boolean } = {},
): T {
    return new Proxy<T>(toRaw(source), {
        get(target: T, p: PropertyKey, receiver: any): any {
            if (p === targetSymbol) {
                return target
            }
            const value = Reflect.get(target, p, receiver)
            const desc = Reflect.getOwnPropertyDescriptor(target, p)
            if (p === "__ngContext__") {
                return value
            }
            if (
                (desc && desc.enumerable) ||
                value === null ||
                value === undefined
            ) {
                addDeps(target, p)
            }
            if (
                (desc && !desc.writable && !desc.configurable) ||
                opts.shallow
            ) {
                return value
            }
            if (typeof value === "object" && value !== null) {
                if (cache.has(value)) {
                    return cache.get(value)
                }
                const state = reactiveFactory(context, value, opts)
                cache.set(value, state)
                return state
            }
            return value
        },
        set(target: T, p: PropertyKey, value: any, receiver: any): boolean {
            if (value instanceof QueryList) {
                value = reactiveFactory(context, value, { shallow: true })
            }
            const success = Reflect.set(target, p, value, receiver)
            check(context)
            return success
        },
    })
}

export function onChanges(fn: (changes: SimpleChanges) => Teardown) {
    addHook(fn, LifecycleHook.OnChanges)
}

export function afterContentInit(fn: () => Teardown) {
    addHook(fn, LifecycleHook.AfterContentInit)
}

export function afterContentChecked(fn: () => Teardown) {
    addHook(fn, LifecycleHook.AfterContentChecked)
}

export function afterViewInit(fn: () => Teardown) {
    addHook(fn, LifecycleHook.AfterViewInit)
}

export function afterViewChecked(fn: () => Teardown) {
    addHook(fn, LifecycleHook.AfterViewChecked)
}

export function onDestroy(fn: () => Teardown) {
    addHook(fn, LifecycleHook.OnDestroy)
}

export function check(context: any) {
    schedule(LifecycleHook.DoCheck, context)
}

export function changes(context: any, changes: SimpleChanges) {
    getOrSetChanges(changes)
    schedule(LifecycleHook.OnChanges, context)
}

export function contentInit(context: any) {
    schedule(LifecycleHook.AfterContentInit, context)
}

export function contentChecked(context: any) {
    schedule(LifecycleHook.AfterContentChecked, context)
}

export function viewInit(context: any) {
    schedule(LifecycleHook.AfterViewInit, context)
}

export function viewChecked(context: any) {
    schedule(LifecycleHook.AfterViewChecked, context)
}

export function destroy(context: any) {
    schedule(LifecycleHook.OnDestroy, context)
    setContext()
    setLifecycleHook()
}

const refSymbol = Symbol("Ref")

function createRef<T>(value: T): Ref<T> {
    function Ref(value?: T) {
        if (arguments.length === 1) {
            ref.value = value as T
        }
        return ref.value
    }
    Ref.value = unref(value as any)
    Object.defineProperty(Ref, refSymbol, {})
    const ref = reactiveFactory(getContext(), Ref)
    return ref as Ref<T>
}

export type UnwrapRef<T> = T extends Ref<infer R> ? R : T

export function Ref<T extends object>(
    value: T,
): T extends Ref<any> ? T : Ref<UnwrapRef<T>>
export function Ref(value: boolean): Ref<boolean>
export function Ref<T>(value: T): Ref<UnwrapRef<T>>
export function Ref<T = any>(): Ref<T | undefined>
export function Ref<T = any>(): Ref<T | undefined>
export function Ref(value?: unknown): Ref<any> {
    return createRef(value)
}

const refCache = new WeakMap<any, Map<PropertyKey, Ref<any>>>()

export function toRefs<T extends object>(value: T): Refs<T> {
    const cache =
        refCache.get(value) || refCache.set(value, new Map()).get(value)!

    return new Proxy(value, {
        get(target: T, p: PropertyKey, receiver: any) {
            if (cache.has(p)) {
                return cache.get(p)
            }
            const ref = createRef(Reflect.get(target, p, receiver))
            cache.set(p, ref)
            return ref
        },
        set() {
            return false
        },
    }) as Refs<T>
}

function isRef<T extends unknown>(value: T | Ref<any>): value is Ref<any> {
    // noinspection SuspiciousTypeOfGuard
    return value instanceof Object && Reflect.has(value, refSymbol)
}

export function unref<T>(value: T): T extends Ref<infer R> ? R : T {
    return isRef(value) ? value.value : value
}

export interface OnConnect<T extends object = {}> {
    ngOnConnect(props: T): Partial<T> | void
}

export type ConnectableFunction<T = any> = (props: T, refs: Refs<T>) => void

export interface Ref<T extends any> {
    <T extends object>(value: T): T extends Ref<any> ? T : Ref<UnwrapRef<T>>
    (value: boolean): Ref<boolean>
    <T>(value: T): Ref<UnwrapRef<T>>
    <T = any>(): Ref<T | undefined>
    (value: T): T
    value: T
}

export type Refs<T> = {
    readonly [key in keyof T]: Ref<T[key]>
}
