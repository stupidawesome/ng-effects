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
    KeyValueDiffers,
    Type,
    ViewContainerRef,
} from "@angular/core"
import {
    Context,
    EffectHook,
    EffectOptions,
    LifecycleHook,
    OnConnect,
} from "./interfaces"
import { CONNECTABLE } from "./constants"
import { Subject, TeardownLogic } from "rxjs"
import { getLifecycleHook, setLifecycleHook } from "./lifecycle"

type CleanupMap = Map<LifecycleHook, Set<TeardownLogic>>

const injectorMap = new WeakMap<Context, Injector>()
const cleanupMap = new WeakMap<Context, CleanupMap>()
const effects = new Map<EffectHook, EffectOptions>()
const hooksMap = new WeakMap<Context, Map<LifecycleHook, Set<EffectHook>>>()
const schedulerMap = new WeakMap<Context, Subject<LifecycleHook | undefined>>()

let activeContext: undefined | Context

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

export function setContext(context?: any) {
    activeContext = context
}

export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags,
): T | null
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
): T
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags?: InjectFlags,
): T | null {
    const injector = getInjector()
    const optional =
        flags && Boolean(flags & InjectFlags.Optional) ? null : undefined
    // Workaround for https://github.com/angular/angular/issues/31776
    if (flags) {
        let parent: Injector
        if (
            Boolean(flags & InjectFlags.SkipSelf) ||
            Boolean(flags & InjectFlags.Self)
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
            if (Boolean(flags & InjectFlags.SkipSelf) && parent) {
                return parent.get(token, optional)
            }
            if (Boolean(flags & InjectFlags.Self)) {
                const current: T = injector.get(token as any, null)
                const parentExists = parent ? parent.get(token, null) : null
                if (optional === null && parentExists === current) {
                    return null
                }
                if (parentExists === null || parentExists !== current) {
                    return current
                } else {
                    throw new Error(
                        `EXCEPTION: No provider for ${
                            "name" in token ? token.name : token.toString()
                        }`,
                    )
                }
            }
        }
    }
    try {
        return injector.get(token, optional, flags)
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

export function flush(cleanup: Set<TeardownLogic>) {
    for (const teardown of cleanup) {
        unsubscribe(teardown)
    }
    cleanup.clear()
}

const invalidationsMap = new WeakMap<Context, Map<Function, () => boolean>>()
const previousValues = new WeakMap<Context, any[] | undefined>()

function getInvalidations(context: Context) {
    return (
        invalidationsMap.get(context) ||
        invalidationsMap.set(context, new Map()).get(context)!
    )
}

function getValues(deps: Map<any, Set<any>>) {
    const current: any = []
    Array.from(deps).map(([context, keys]) => {
        Array.from(keys).map((key) => {
            current.push(context[key])
        })
    })
    return current
}

export function invalidateEffects(target: Context) {
    const invalidations = getInvalidations(target)
    const effectsToRun = new Set<Function>()
    let changed = false
    for (const [invalidate, detectChanges] of invalidations) {
        if (detectChanges()) {
            changed = true
            effectsToRun.add(invalidate())
        }
    }
    for (const effect of effectsToRun) {
        effect()
    }
    return changed
}

export function runEffect(
    context: Context,
    effect: EffectHook,
    options: EffectOptions,
    cleanup: Set<TeardownLogic>,
    differs: IterableDiffers,
) {
    effects.delete(effect)
    collectDeps()
    const teardown = effect({
        closed: false,
        complete() {
            this.closed = true
        },
    })
    const flushedDeps = flushDeps()
    const deps = options.watch ? flushedDeps : new Map()
    const invalidations = getInvalidations(context)
    const differ = differs.find([]).create()

    differ.diff(getValues(deps))

    function detectChanges() {
        return hasChanges(differ, getValues(deps))
    }

    const invalidation = () => {
        cleanup.delete(teardown)
        invalidations.delete(invalidation)
        previousValues.delete(deps)
        unsubscribe(teardown)
        return function () {
            runEffect(context, effect, options, cleanup, differs)
        }
    }
    invalidations.set(invalidation, detectChanges)
    cleanup.add(teardown)
}

export function runEffects(
    context: Context,
    cleanup: Set<TeardownLogic>,
    differs: IterableDiffers,
) {
    for (const [effect, options] of effects) {
        runEffect(context, effect, options, cleanup, differs)
    }
}

export function runHooks(
    lifecycle: LifecycleHook,
    hooks: Set<EffectHook>,
    cleanup: Set<TeardownLogic>,
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
                        const teardown = hook({
                            closed: false,
                            complete() {
                                if (!this.closed) {
                                    cleanup.delete(teardown)
                                    unsubscribe(teardown)
                                }
                                this.closed = true
                            },
                        })
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

export function unsubscribe(teardown: TeardownLogic) {
    if (typeof teardown === "function") {
        teardown()
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
    const iterableDiffers = inject(KeyValueDiffers)
    const scheduler = getScheduler()
    const context: { [key: string]: any } = getContext()
    const changeDetectorRef = inject(
        ChangeDetectorRef as Type<any>,
        InjectFlags.Optional,
    )
    const differ = iterableDiffers.find(context).create()
    const hasOnChanges = Boolean(getHooks().get(LifecycleHook.OnChanges))

    scheduler.subscribe((lifecycle) => {
        switch (lifecycle) {
            case LifecycleHook.DoCheck: {
                const invalidated = invalidateEffects(context)
                if (hasOnChanges || invalidated) {
                    if (hasChanges(differ, context)) {
                        if (changeDetectorRef) {
                            changeDetectorRef.markForCheck()
                        }
                        scheduler.next(LifecycleHook.OnChanges)
                    }
                }
                break
            }
            case LifecycleHook.AfterViewChecked: {
                runInContext(context, LifecycleHook.WhenRendered, () =>
                    scheduler.next(LifecycleHook.WhenRendered),
                )
                break
            }
            case LifecycleHook.OnDestroy: {
                scheduler.complete()
            }
        }
    })

    schedule(LifecycleHook.OnInit)
}

export function setup() {
    const initializers = inject(
        CONNECTABLE,
        InjectFlags.Self | InjectFlags.Optional,
    )
    const context = getContext<Partial<OnConnect>>()
    const reactive = reactiveFactory(context, context, { shallow: true })
    const cleanup = cleanupMap.get(context) as Map<
        LifecycleHook,
        Set<TeardownLogic>
    >

    if (reactive.ngOnConnect) {
        reactive.ngOnConnect()
    }

    if (initializers) {
        for (const initializer of initializers) {
            initializer(reactive)
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
    const reactive = reactiveFactory<T>(context, context)
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

    for (const index of Array.from({ length: 6 }).keys()) {
        cleanup.set(index, new Set<TeardownLogic>())
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
                useFactory: setup,
                deps: [],
            },
        ],
    })

    setContext()
    setLifecycleHook()
    runInContext(context, LifecycleHook.OnInit, () => injector.get(setup))
}

export function addEffect(fn: EffectHook, options: EffectOptions = {}) {
    if (getLifecycleHook()) {
        effects.set(fn, options)
    } else {
        throw new Error("Cannot use effects here")
    }
}

export function addHook(fn: EffectHook, lifecycle: LifecycleHook) {
    hooksMap.get(getContext())?.get(lifecycle)?.add(fn)
}

export const depsMap = new Map<{ [key: string]: any }, Set<string | number>>()

let depsEnabled = false

export function getDeps(object: object) {
    return depsMap.get(object) || depsMap.set(object, new Set()).get(object)!
}

export function collectDeps() {
    depsEnabled = true
}

export function addDeps(object: Context, key: any) {
    if (depsEnabled) {
        getDeps(object).add(key)
    }
}

export function flushDeps() {
    const deps = new Map(depsMap)
    depsEnabled = false
    depsMap.clear()
    return deps
}

const cache = new WeakMap()

export function reactiveFactory<T extends object>(
    context: any,
    source: T,
    opts: any = { shallow: true },
): T {
    return new Proxy<T>(source, {
        get(target: T, p: PropertyKey, receiver: any): any {
            if (p === targetSymbol) {
                return target
            }
            const value = Reflect.get(target, p, receiver)
            const desc = Reflect.getOwnPropertyDescriptor(target, p)
            if (p === "__ngContext__") {
                return value
            }
            if (desc && desc.enumerable) {
                addDeps(target, p)
            }
            if (
                ((desc && !desc.writable && !desc.configurable) ||
                    opts.shallow) &&
                typeof value !== "function"
            ) {
                return value
            }
            if (cache.has(value)) {
                return cache.get(value)
            }
            if (typeof value === "function") {
                const fn = new Proxy(value, {
                    apply(target: any, thisArg: any, argArray?: any): any {
                        return runInContext(
                            toRaw(thisArg),
                            getLifecycleHook(),
                            function () {
                                flushInvalidations(target)
                                setExecutionContext(target)
                                const returnValue = target.apply(
                                    thisArg,
                                    argArray,
                                )
                                setExecutionContext()
                                return returnValue
                            },
                        )
                    },
                })
                cache.set(value, fn)
                return fn
            }
            if (typeof value === "object" && value !== null) {
                const state = reactiveFactory(context, value, opts)
                cache.set(value, state)
                return state
            }
            return value
        },
        set(target: T, p: PropertyKey, value: any, receiver: any): boolean {
            const success = Reflect.set(target, p, value, receiver)
            check(context)
            return success
        },
    })
}

let executionContext: Function | undefined

export function getExecutionContext() {
    if (executionContext) {
        return executionContext
    }
    throw new Error("Invalid execution context")
}

export function setExecutionContext(context?: any) {
    executionContext = context
}

export function flushInvalidations(context: any) {
    for (const teardown of teardownCache.get(context) ?? []) {
        unsubscribe(teardown)
    }
    teardownCache.delete(context)
}

const teardownCache = new WeakMap<any, Set<TeardownLogic>>()

export function onInvalidate(teardown: TeardownLogic) {
    const context = getExecutionContext()
    const cache =
        teardownCache.get(context) ||
        teardownCache.set(context, new Set()).get(context)!
    cache.add(() => {
        unsubscribe(teardown)
        cleanup.delete(teardown)
    })
    const cleanup = cleanupMap.get(getContext())!.get(LifecycleHook.OnDestroy)!
    cleanup.add(teardown)
}

export function onChanges(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.OnChanges)
}

export function afterViewInit(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.AfterViewInit)
}

export function whenRendered(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.WhenRendered)
}

export function onDestroy(fn: () => TeardownLogic) {
    addHook(fn, LifecycleHook.OnDestroy)
}

export function check(context: any) {
    schedule(LifecycleHook.DoCheck, context)
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
