import {
    asapScheduler,
    BehaviorSubject,
    concat,
    defer,
    isObservable,
    merge,
    Observable,
    of,
    pipe,
    Subject,
    TeardownLogic,
} from "rxjs"
import { InitEffectArgs } from "./interfaces"
import {
    distinctUntilChanged,
    filter,
    map,
    share,
    startWith,
    subscribeOn,
    tap,
} from "rxjs/operators"
import { currentContext, defaultOptions, effectsMap } from "./constants"
import { HostRef } from "../constants"
import { EffectHandler, EffectMetadata, EffectOptions } from "../interfaces"
import { DestroyObserver } from "./destroy-observer"
import { Injector } from "@angular/core"
import { doCheck } from "../patch-hooks"
import { ViewRenderer } from "./view-renderer"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

export function noop() {}

export function select(obj: any, key: string) {
    return pipe(
        map(() => obj[key]),
        distinctUntilChanged(),
    )
}

export function observe(obj: any, isDevMode: boolean) {
    const ownProperties = Object.getOwnPropertyNames(obj)
    const notifier = new Subject<any>()
    let revoke = noop
    let state: any = {}

    for (const key of ownProperties) {
        const changes = notifier.pipe(select(obj, key), share())
        const propertyObserver: any = merge(
            defer(() => of(obj[key])),
            changes,
        )
        propertyObserver.changes = changes
        state[key] = propertyObserver
    }

    if (isDevMode && typeof Proxy !== "undefined") {
        const revocable = Proxy.revocable(state, {
            get(target: any, p: string) {
                if (!target[p]) {
                    throwMissingPropertyError(p, obj.constructor.name)
                }
                return target[p]
            },
        })
        state = revocable.proxy
        revoke = revocable.revoke
    }
    return {
        notifier,
        state,
        revoke,
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
        // wait until first change detection
        subs.add(
            returnValue
                .pipe(
                    tap((value: any) => {
                        if (adapter) {
                            adapter.next(value, options)
                        }
                        // first set the value
                        else if (options.apply) {
                            for (const prop of Object.keys(value)) {
                                if (!hostContext.hasOwnProperty(prop)) {
                                    throwMissingPropertyError(prop, hostContext.constructor.name)
                                }
                                hostContext[prop] = value[prop]
                            }
                        } else if (hostContext.hasOwnProperty(binding)) {
                            hostContext[binding] = value
                        }
                        notifier.next()
                    }),
                    subscribeOn(asapScheduler),
                )
                .subscribe(() => {
                    if (options.adapter) {
                        return
                    }
                    // markDirty or detect changes
                    if (options.detectChanges) {
                        viewRenderer.detectChanges(hostContext, cdr)
                    } else if (options.markDirty) {
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
    isDevMode: boolean,
    strictMode: boolean,
    destroyObserver: DestroyObserver,
    viewRenderer: ViewRenderer,
    injector: Injector,
    ...effects: any[]
): EffectMetadata[] {
    const hostContext = hostRef.instance
    const { state, revoke, notifier } = observe(hostContext, isDevMode)
    const defaults = Object.assign({}, defaultOptions, options)
    const sub = merge(viewRenderer.whenScheduled(), viewRenderer.whenRendered()).subscribe(notifier)

    destroyObserver.destroyed.subscribe(revoke)
    destroyObserver.destroyed.subscribe(() => sub.unsubscribe())

    return Array.from(
        exploreEffects(defaults, state, hostContext, strictMode, injector, notifier, [
            hostRef.instance,
            ...effects,
        ]),
    )
}

export const effectsMetadata = new Map()

export function* exploreEffects(
    defaults: EffectOptions,
    proxy: any,
    hostContext: any,
    strictMode: boolean,
    injector: Injector,
    notifier: Subject<void>,
    effects: any[],
) {
    for (const effect of effects) {
        const type = effect.constructor
        if (effectsMetadata.has(type)) {
            yield effectsMetadata.get(type)
        }
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
                const binding = strictMode ? options.bind : options.bind || key
                const checkBinding = options.bind

                if (options.adapter) {
                    adapter = injector.get(options.adapter)
                }

                if (
                    typeof checkBinding === "string" &&
                    Object.getOwnPropertyDescriptor(hostContext, checkBinding) === undefined
                ) {
                    throwMissingPropertyError(checkBinding, type.name)
                }

                const metadata = {
                    name: type.name,
                    key,
                    binding,
                    effect: effectFn.bind(effect, proxy, hostContext),
                    options,
                    adapter,
                    notifier,
                }

                effectsMetadata.set(type, metadata)

                yield metadata
            }
        }
    }
}
