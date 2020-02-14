import {
    asapScheduler,
    BehaviorSubject,
    isObservable,
    merge,
    Observable,
    Subject,
    TeardownLogic,
} from "rxjs"
import { InitEffectArgs } from "./interfaces"
import { distinctUntilChanged, map, mapTo, observeOn, tap } from "rxjs/operators"
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

export function state<T>(source: Observable<T>, target: any) {
    return Proxy.revocable(target as any, {
        get(_, key: PropertyKey) {
            return selectKey(source, key)
        },
        set() {
            return false
        },
    })
}

export function noop() {}

export function observe(obj: any, destroyObserver: DestroyObserver) {
    const notifier = new BehaviorSubject<any>(null)
    const observer = notifier.pipe(mapTo(obj))
    const { proxy, revoke } = state(observer, obj)

    destroyObserver.destroyed.subscribe(() => {
        revoke()
        notifier.complete()
        notifier.unsubscribe()
    })

    return {
        notifier,
        state: proxy,
    }
}

export function throwBadReturnTypeError() {
    throw new Error("[ng-effects] Effects must either return an observable, subscription, or void")
}

export function isTeardownLogic(value: any): value is TeardownLogic {
    return (
        typeof value === "function" ||
        (typeof value === "object" && typeof value.unsubscribe === "function")
    )
}

export function initEffect({
    effect,
    binding,
    options,
    cdr,
    hostContext,
    subs,
    viewRenderer,
    adapter,
    notifier,
}: InitEffectArgs) {
    const returnValue = effect()

    if (returnValue === undefined) {
        return
    }

    if (isObservable(returnValue)) {
        subs.add(
            returnValue
                .pipe(
                    tap((value: any) => {
                        if (adapter) {
                            adapter.next(value, options)
                        } else if (options.apply) {
                            for (const prop of Object.keys(value)) {
                                if (!hostContext.hasOwnProperty(prop)) {
                                    throwMissingPropertyError(prop, hostContext.constructor.name)
                                }
                                hostContext[prop] = value[prop]
                            }
                        } else if (binding) {
                            if (!hostContext.hasOwnProperty(binding)) {
                                throwMissingPropertyError(binding, hostContext.constructor.name)
                            }
                            hostContext[binding] = value
                        }
                        if (options.detectChanges) {
                            viewRenderer.detectChanges(hostContext, cdr)
                        } else {
                            notifier.next()
                        }
                    }),
                    observeOn(asapScheduler),
                )
                .subscribe(() => {
                    if (options.markDirty) {
                        viewRenderer.markDirty(hostContext, cdr)
                    }
                }),
        )
    } else if (isTeardownLogic(returnValue)) {
        subs.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
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
    ...effects: any[]
): EffectMetadata[] {
    const hostContext = hostRef.instance
    const { state, notifier } = observe(hostContext, destroyObserver)
    const defaults = Object.assign({}, defaultOptions, options)
    const sub = merge(viewRenderer.whenScheduled(), viewRenderer.whenRendered()).subscribe(notifier)

    destroyObserver.destroyed.subscribe(() => sub.unsubscribe())

    return Array.from(
        exploreEffects(defaults, state, hostContext, injector, notifier, [
            hostRef.instance,
            ...effects,
        ]),
    )
}

export function* exploreEffects(
    defaults: EffectOptions,
    proxy: any,
    hostContext: any,
    injector: Injector,
    notifier: Subject<void>,
    effects: any[],
) {
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

                if (
                    typeof binding === "string" &&
                    Object.getOwnPropertyDescriptor(hostContext, binding) === undefined
                ) {
                    throwMissingPropertyError(binding, hostContext.constructor.name)
                }

                const metadata = {
                    key,
                    binding,
                    effect: effectFn.bind(effect, proxy, hostContext),
                    options,
                    adapter,
                    notifier,
                }

                yield metadata
            }
        }
    }
}
