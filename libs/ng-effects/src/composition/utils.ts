import { InjectionToken, Type } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"
import { DestroyObserver } from "../connect/destroy-observer"
import { distinctUntilChanged, map, skip, startWith, switchMap } from "rxjs/operators"
import { ViewRenderer } from "../scheduler/view-renderer"
import { HostRef } from "../connect/interfaces"
import { ChangeDetection, ChangeDetectionMap } from "./interfaces"
import { unsubscribe } from "../connect/utils"
import { ChangeNotifier } from "../connect/change-notifier"
import { addHook, getContext, getLifeCycle, LifeCycleHooks } from "../connect/hooks"

export function inject<T>(token: { prototype: T } | Type<T> | InjectionToken<T>): T {
    const injector = getContext()
    if (!injector) {
        throw new Error("inject() must be called from a valid injection context.")
    }
    return injector.get(token as any)
}

export function useHostRef<T extends any>(): HostRef<T> {
    return inject(HostRef) as HostRef<T>
}

export function useContext<T extends any>() {
    return useHostRef<T>().context
}

export function effect(fn: () => TeardownLogic) {
    const teardown = useTeardown()
    const changeNotifier: Observable<any> = inject(ChangeNotifier)
    const scheduler = inject(ViewRenderer)
    addHook(
        getLifeCycle(),
        teardown(() => {
            let deps: Map<any, PropertyKey> = new Map()
            let cleanup: TeardownLogic

            return scheduler.whenScheduled
                .pipe(
                    map(() => Array.from(deps.entries()).map(([target, key]) => target[key])),
                    distinctUntilChanged((a, b) => a.every((val, i) => val === b[i])),
                    skip(1),
                    startWith(null),
                    switchMap(() => {
                        unsubscribe([cleanup])
                        deps = new Map()
                        const sub = changeNotifier.subscribe(arg => {
                            if (arg && arg.key) {
                                deps.set(arg.target, arg.key)
                            }
                        })
                        cleanup = fn()
                        sub.unsubscribe()
                        return new Observable(() => cleanup)
                    }),
                )
                .subscribe()
        }),
    )
}

export function whenRendered(fn: () => TeardownLogic) {
    addHook(LifeCycleHooks.WhenRendered, fn)
}

export function afterViewInit(fn: () => TeardownLogic) {
    addHook(LifeCycleHooks.AfterViewInit, fn)
}

export function onChanges(fn: () => TeardownLogic) {
    addHook(LifeCycleHooks.OnChanges, fn)
}

export function onDestroy(fn: () => void) {
    const teardown = useTeardown()
    addHook(
        getLifeCycle(),
        teardown(() => fn),
    )
}

const cache = new WeakMap()

export function stateFactory<T extends object>(
    context: T,
    changeNotifier: ChangeNotifier,
    opts: ChangeDetectionMap<T> | ChangeDetection = {},
): T {
    return new Proxy<T>(context, {
        get(target: T, p: PropertyKey, receiver: any): any {
            if (!Reflect.has(target, p)) {
                throw new Error(`[ng-effects] Cannot get uninitialized property: ${String(p)}`)
            }
            changeNotifier.next({ target, key: p } as any)
            const value = Reflect.get(target, p, receiver)
            const desc = Object.getOwnPropertyDescriptor(target, p)
            if (desc && !desc.writable && !desc.configurable) {
                return value
            }

            if (typeof value === "object" && value !== null) {
                if (cache.has(value)) {
                    return cache.get(value)
                }
                const changes = typeof opts === "number" ? opts : Reflect.get(opts, p)
                const state = stateFactory(value, changeNotifier, changes)
                cache.set(value, state)
                return state
            } else return value
        },
        set(target: T, p: PropertyKey, value: any, receiver: any): boolean {
            if (!Reflect.has(target, p)) {
                throw new Error(`[ng-effects] Cannot set uninitialized property: ${String(p)}`)
            }
            const success = Reflect.set(target, p, value, receiver)
            const changes = typeof opts === "number" ? opts : Reflect.get(opts, p)
            if (changes === ChangeDetection.DetectChanges) {
                changeNotifier.next({ detectChanges: true })
            } else if (changes === ChangeDetection.MarkDirty) {
                changeNotifier.next({ markDirty: true })
            }
            return success
        },
    })
}

export function useReactive<T extends object>(
    value: T,
    opts?: ChangeDetectionMap<T> | ChangeDetection,
): T {
    const changeNotifier = inject(ChangeNotifier)
    return stateFactory(value, changeNotifier, opts)
}

export function useTeardown<T extends any>() {
    const destroy = inject(DestroyObserver)
    return function effect(factory: () => TeardownLogic) {
        const sub = factory()
        destroy.add(sub)
        return () => unsubscribe([sub])
    }
}
