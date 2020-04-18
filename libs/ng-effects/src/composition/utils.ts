import { inject as oinject, InjectionToken, Type } from "@angular/core"
import { Observable, TeardownLogic } from "rxjs"
import { DestroyObserver } from "../connect/destroy-observer"
import { bufferCount, distinctUntilChanged, map, startWith, switchMap } from "rxjs/operators"
import { ViewRenderer } from "../scheduler/view-renderer"
import { HostRef } from "../connect/interfaces"
import { ChangeNotifier } from "../connect/providers"

export function inject<T>(token: { prototype: T } | Type<T> | InjectionToken<T>): T {
    return oinject(token as any)
}

export const use = inject

export function useHostRef<T extends any>(): HostRef<T> {
    return use(HostRef) as HostRef<T>
}

export function useContext<T extends any>() {
    return useHostRef<T>().context
}

export function useEffect(fn: () => TeardownLogic, deps?: (() => any)[]): void {
    const viewRenderer = use(ViewRenderer)
    const teardown = useTeardown()
    const inner = new Observable(() => {
        return fn()
    })
    let obs: Observable<any> = viewRenderer.whenScheduled().pipe(startWith(0), bufferCount(3))

    if (deps) {
        obs = obs.pipe(
            map(() => deps.map(dep => dep())),
            distinctUntilChanged((a, b) => a.every((val, i) => val === b[i])),
        )
    }

    teardown(() => obs.pipe(switchMap(() => inner)).subscribe())
}

export type UseState<T> = {
    [key in keyof T]-?: [
        () => T[key],
        (value: T[key], opts?: { markDirty?: boolean; detectChanges?: boolean }) => void,
    ]
}

export function stateFactory<T>(
    context: T,
    changeNotifier: ChangeNotifier,
): <U extends keyof T>(key: U) => [() => T[U], (value: T[U]) => void] {
    return function<U extends keyof T>(key: U) {
        function state(): T[U] {
            return context[key]
        }
        function setState(value: T[U], flags: any = { markDirty: true }) {
            context[key] = value
            changeNotifier.next(flags)
        }

        return [state, setState]
    }
}

function mapState(state: any, context: any, factory: any) {
    return Object.entries(context).reduce((acc, [key, _value]) => {
        return Object.defineProperty(acc, key, {
            configurable: true,
            get() {
                Object.defineProperty(acc, key, {
                    enumerable: true,
                    value: factory(key),
                })
                return acc[key]
            },
        })
    }, state)
}

const stateMap = new WeakMap()

export function useState<T>(): UseState<T> {
    const context = useContext()

    if (stateMap.has(context)) {
        return stateMap.get(context)
    }

    const changeNotifier = use(ChangeNotifier)
    const factory = stateFactory(context, changeNotifier)
    const state = {} as UseState<T>

    stateMap.set(context, state)

    return mapState(state, context, factory)
}

export function useTeardown<T extends any>() {
    const destroy = use(DestroyObserver)
    return function effect(factory: () => TeardownLogic) {
        destroy.add(factory())
    }
}
