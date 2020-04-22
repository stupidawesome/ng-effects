import {
    AbstractType,
    inject as oinject,
    InjectFlags,
    InjectionToken,
    Injector,
    KeyValueChanges,
    KeyValueDiffers,
    Type,
} from "@angular/core"
import { Context, EffectHook, LifecycleHook, OnConnect } from "./interfaces"
import { CONNECTABLE } from "./constants"
import { Subject, TeardownLogic } from "rxjs"

type CleanupMap = Map<LifecycleHook, Set<TeardownLogic>>

const injectors: Injector[] = []
const injectorMap = new WeakMap<Context, Injector>()
const cleanupMap = new WeakMap<Context, CleanupMap>()
const effects = new Set<EffectHook>()
const hooksMap = new WeakMap<Context, Map<LifecycleHook, Set<EffectHook>>>()
const schedulerMap = new WeakMap<Context, Subject<LifecycleHook | undefined>>()

let activeContext: undefined | Context
let activeLifecycleHook: undefined | LifecycleHook

export function throwMissingInjectorError(): never {
    throw new Error("[ngfx] Injector not found.")
}

export function throwMissingContextError(): never {
    throw new Error("[ngfx] Invalid execution context")
}

export function takeInjector() {
    const injector = injectors.shift()
    if (injector) {
        return injector
    } else {
        throwMissingInjectorError()
    }
}

export function getInjector() {
    const injector = injectorMap.get(getContext())

    if (!injector) {
        throwMissingInjectorError()
    }

    return injector
}

export function getContext<T extends object>(): T {
    if (activeContext) {
        return activeContext as T
    } else {
        throwMissingContextError()
    }
}

export function schedule(lifecycle: LifecycleHook, context: Context = getContext()) {
    runInContext(context, lifecycle, () => getScheduler(context).next(lifecycle))
}

export function getScheduler(context = getContext()): Subject<LifecycleHook | undefined> {
    const scheduler = schedulerMap.get(context)
    if (scheduler) {
        return scheduler
    } else {
        throw new Error("Cannot get scheduler for current context")
    }
}

export function setContext(context?: any) {
    activeContext = context
}

export function getLifecycleHook(): LifecycleHook | undefined {
    return activeLifecycleHook
}

export function setLifecycleHook(lifecycle?: LifecycleHook) {
    return (activeLifecycleHook = lifecycle)
}

export function inject<T>(token: Type<T> | AbstractType<T> | InjectionToken<T>): T
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags?: InjectFlags,
): T | null {
    return oinject(token as any, flags)
}

export function getHooks() {
    return hooksMap.get(getContext())
}

export function flush(cleanup: Set<TeardownLogic>) {
    for (const teardown of cleanup) {
        unsubscribe(teardown)
    }
    cleanup.clear()
}

export function runEffects(cleanup: Set<TeardownLogic>) {
    for (const effect of effects) {
        cleanup.add(effect())
    }
    effects.clear()
}

export function runHooks(
    lifecycle: LifecycleHook,
    hooks: Set<EffectHook>,
    cleanup: Set<TeardownLogic>,
) {
    const scheduler = getScheduler()
    const context = getContext()

    scheduler.subscribe({
        next: current => {
            if (current === lifecycle) {
                flush(cleanup)
                for (const hook of hooks) {
                    runInContext(context, lifecycle, () => {
                        cleanup.add(hook())
                        runEffects(cleanup)
                    })
                }
            }
        },
        error: error => console.error(error),
        complete: () => flush(cleanup),
    })
}

export function onDestroyHook(effects: Set<EffectHook>, cleanup: Set<TeardownLogic>) {
    const scheduler = getScheduler()

    runHooks(LifecycleHook.OnDestroy, effects, cleanup)
}

export function unsubscribe(teardown: TeardownLogic) {
    if (typeof teardown === "function") {
        teardown()
    } else if (teardown && "unsubscribe" in teardown) {
        teardown.unsubscribe()
    }
}

export function noop() {}

export function hasChanges(diff: KeyValueChanges<any, any> | null): boolean {
    if (diff === null) {
        return false
    }
    let changed = false
    diff.forEachItem(record => {
        changed = changed || record.currentValue !== record.previousValue
    })
    return changed
}

export function runScheduler() {
    const iterableDiffers = inject(KeyValueDiffers)
    const scheduler = getScheduler()
    const context: { [key: string]: any } = getContext()
    const differ = iterableDiffers.find(context).create()
    let changes = true

    scheduler.subscribe(lifecycle => {
        switch (lifecycle) {
            case LifecycleHook.DoCheck: {
                const diff = differ.diff(context)
                if (hasChanges(diff)) {
                    changes = true
                    runInContext(context, LifecycleHook.OnChanges, () =>
                        scheduler.next(LifecycleHook.OnChanges),
                    )
                }
                break
            }
            case LifecycleHook.AfterViewChecked: {
                if (changes) {
                    changes = false
                    runInContext(context, LifecycleHook.WhenRendered, () =>
                        scheduler.next(LifecycleHook.WhenRendered),
                    )
                }
                break
            }
            case LifecycleHook.OnDestroy: {
                scheduler.complete()
                scheduler.unsubscribe()
            }
        }
    })

    schedule(LifecycleHook.OnInit)
}

export function setup() {
    const initializers = oinject(CONNECTABLE, InjectFlags.Host | InjectFlags.Optional)
    const context = getContext<Partial<OnConnect>>()
    const cleanup = cleanupMap.get(context) as Map<LifecycleHook, Set<TeardownLogic>>

    if (context.ngOnConnect) {
        context.ngOnConnect()
    }

    if (initializers) {
        for (const initializer of initializers) {
            initializer(context)
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
    setContext(context)
    setLifecycleHook(lifecycle)
    const returnValue = func()
    setContext()
    return returnValue
}

export function connect(injector: Injector) {
    injectors.push(injector)
}

export function init(context: any) {
    const cleanup = new Map()
    const lifecycle = new Map()

    for (const [index] of Array.from({ length: 6 }).entries()) {
        cleanup.set(index, new Set<TeardownLogic>())
        lifecycle.set(index, new Set<EffectHook>())
    }

    const hostInjector = takeInjector()
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
    injectorMap.set(context, hostInjector)
    hooksMap.set(context, lifecycle)
    cleanupMap.set(context, cleanup)
    schedulerMap.set(context, new Subject())

    runInContext(context, LifecycleHook.OnInit, () => injector.get(setup))
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
}

export function addEffect(fn: EffectHook) {
    effects.add(fn)
}

export function addHook(fn: EffectHook, lifecycle: LifecycleHook) {
    hooksMap
        .get(getContext())
        ?.get(lifecycle)
        ?.add(fn)
}
