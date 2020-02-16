import { BehaviorSubject, merge, NEVER, Observable, Subject, TeardownLogic } from "rxjs"
import { distinctUntilChanged, map, mapTo } from "rxjs/operators"
import { currentContext, defaultOptions, effectsMap } from "./constants"
import { HostRef } from "../constants"
import { EffectHandler, EffectMetadata, EffectOptions } from "../interfaces"
import { DestroyObserver } from "./destroy-observer"
import { Injector } from "@angular/core"
import { ViewRenderer } from "./view-renderer"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

function selectKey(source: Observable<any>, key: PropertyKey) {
    return source.pipe(
        map(value => value[key]),
        distinctUntilChanged(),
    )
}

export function proxyState<T>(source: Observable<T>, target: any) {
    if (typeof Proxy !== "undefined") {
        return new Proxy(target as any, {
            get(target, key: PropertyKey) {
                try {
                    assertPropertyExists(key, target)
                } catch (e) {
                    console.error(e)
                    return NEVER
                }
                return selectKey(source, key)
            },
            set() {
                return false
            },
        })
    } else {
        console.warn(
            "[ng-effects] This browser does not support Proxy objects. Dev mode diagnostics will be limited.",
        )
        return state(source, target)
    }
}

export function state<T>(source: Observable<T>, target: any) {
    const keys = Object.getOwnPropertyNames(target)
    const sources: any = {}

    for (const key of keys) {
        sources[key] = selectKey(source, key)
    }
    return sources
}

export function noop() {}

export function throwBadReturnTypeError() {
    throw new Error("[ng-effects] Effects must either return an observable, subscription, or void")
}

export function isTeardownLogic(value: any): value is TeardownLogic {
    return (
        typeof value === "function" ||
        (typeof value === "object" && typeof value.unsubscribe === "function")
    )
}

export function injectHostRef() {
    const instance = currentContext.values().next().value
    return {
        instance,
    }
}

export function injectEffects(
    options: EffectOptions,
    hostRef: HostRef,
    destroyObserver: DestroyObserver,
    viewRenderer: ViewRenderer,
    injector: Injector,
    stateFactory: Function,
    ...effects: any[]
): EffectMetadata[] {
    const hostContext = hostRef.instance
    const notifier = new BehaviorSubject<any>(null)
    const defaults = Object.assign({}, defaultOptions, options)
    const sub = merge(viewRenderer.whenScheduled(), viewRenderer.whenRendered()).subscribe(notifier)

    destroyObserver.destroyed.subscribe(() => {
        notifier.complete()
        notifier.unsubscribe()
        sub.unsubscribe()
    })

    return Array.from(
        exploreEffects(defaults, state, hostContext, injector, notifier, stateFactory, [
            hostRef.instance,
            ...effects,
        ]),
    )
}

export function assertPropertyExists(key: any, obj: any) {
    if (typeof key === "string" && Object.getOwnPropertyDescriptor(obj, key) === undefined) {
        throwMissingPropertyError(key, obj.constructor.name)
    }
}

export function* exploreEffects(
    defaults: EffectOptions,
    proxy: any,
    hostContext: any,
    injector: Injector,
    notifier: Subject<void>,
    stateFactory: Function,
    effects: any[],
) {
    const observer = notifier.pipe(mapTo(hostContext))

    for (const effect of effects) {
        const props = [
            ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
            ...Object.getOwnPropertyNames(effect),
        ]

        for (const key of props) {
            const effectFn = effect[key]
            const maybeOptions = effectsMap.get(effectFn)

            if (effectFn && maybeOptions) {
                let adapter: EffectHandler<any, any> | undefined
                const options: EffectOptions<any> = Object.assign({}, defaults, maybeOptions)
                const binding = options.bind

                if (options.adapter) {
                    adapter = injector.get(options.adapter)
                }

                const metadata = {
                    key,
                    binding,
                    effect: () =>
                        effectFn.call(effect, stateFactory(observer, hostContext), hostContext),
                    options,
                    adapter,
                    notifier,
                }

                yield metadata
            }
        }
    }
}
