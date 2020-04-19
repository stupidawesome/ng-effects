import { inject as oinject, InjectionToken, Type } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"
import { DestroyObserver } from "../connect/destroy-observer"
import { distinctUntilChanged, filter, map, share, switchMap, take } from "rxjs/operators"
import { ViewRenderer } from "../scheduler/view-renderer"
import { HostRef } from "../connect/interfaces"
import { ChangeNotifier } from "../connect/providers"
import { ChangeDetection, ChangeDetectionMap } from "./interfaces"

export function inject<T>(token: { prototype: T } | Type<T> | InjectionToken<T>): T {
    return oinject(token as any)
}

export const use = inject

export function useHostRef<T extends any>(): HostRef<T> {
    return inject(HostRef) as HostRef<T>
}

export function useContext<T extends any>() {
    return useHostRef<T>().context
}

export function watch<T>(
    target: () => T,
    handler: (newValue: T, oldValue: T) => TeardownLogic,
): void {
    const teardown = useTeardown()
    const scheduler = inject(ViewRenderer)
    let previousValue: any

    teardown(() =>
        scheduler.whenRendered
            .pipe(
                map(target),
                filter(value => value !== previousValue),
                switchMap(value => {
                    const obs = new Observable(() => handler(value, previousValue))
                    previousValue = value
                    return obs
                }),
            )
            .subscribe(),
    )
}

export function whenRendered(fn: () => TeardownLogic) {
    const teardown = useTeardown()
    const scheduler = inject(ViewRenderer)

    teardown(() =>
        scheduler.whenRendered
            .pipe(
                switchMap(() => new Observable(() => fn())),
            )
            .subscribe(),
    )
}

export function afterViewInit(fn: () => TeardownLogic) {
    const teardown = useTeardown()
    const scheduler = inject(ViewRenderer)

    teardown(() =>
        scheduler.whenRendered
            .pipe(
                take(1),
                switchMap(() => new Observable(fn)),
            )
            .subscribe(),
    )
}

const updatedCache = new WeakMap()

export function onChanges(fn: () => TeardownLogic) {
    const teardown = useTeardown()
    const context = useContext()
    const scheduler = inject(ViewRenderer)

    const changes =
        updatedCache.get(context) ||
        updatedCache
            .set(
                context,
                scheduler.whenScheduled.pipe(
                    map(() => Object.values(context)),
                    distinctUntilChanged((a, b) => a.every((val, i) => val === b[i])),
                    share(),
                ),
            )
            .get(context)

    teardown(() => changes.pipe(switchMap(() => new Observable(fn))).subscribe())
}

export function onDestroy(fn: () => void) {
    useTeardown()(() => fn)
}

const cache = new WeakMap()

export function stateFactory<T extends object>(
    context: T,
    changeNotifier: ChangeNotifier,
    opts: ChangeDetectionMap<T> | ChangeDetection = {},
): T {
    return new Proxy<T>(context, {
        get(target: T, p: PropertyKey): any {
            if (!Reflect.has(target, p)) {
                throw new Error(`[ng-effects] Cannot get uninitialized property: ${String(p)}`)
            }
            const value = Reflect.get(target, p)
            if (value instanceof Object) {
                if (cache.has(value)) {
                    return cache.get(value)
                }
                const changes = typeof opts === "number" ? opts : Reflect.get(opts, p)
                const state = stateFactory(value, changeNotifier, changes)
                cache.set(value, state)
                return state
            } else {
                return value
            }
        },
        set(target: T, p: PropertyKey, value: any): boolean {
            if (!Reflect.has(target, p)) {
                throw new Error(`[ng-effects] Cannot set uninitialized property: ${String(p)}`)
            }
            const success = Reflect.set(target, p, value)
            const changes = typeof opts === "number" ? opts : Reflect.get(opts, p)
            if (changes === ChangeDetection.DetectChanges) {
                changeNotifier.next({ detectChanges: true })
            } else if (changes !== ChangeDetection.None) {
                changeNotifier.next({ markDirty: true })
            }
            return success
        },
    })
}

export function useState<T>(opts?: ChangeDetectionMap<T>): T {
    const context = useContext()
    const changeNotifier = inject(ChangeNotifier)

    return stateFactory(context, changeNotifier, opts)
}

export function useTeardown<T extends any>() {
    const destroy = inject(DestroyObserver)
    return function effect(factory: () => TeardownLogic) {
        destroy.add(factory())
    }
}
