import { asapScheduler, concat, defer, isObservable, of, Subject, TeardownLogic } from "rxjs"
import { InitEffectArgs } from "./interfaces"
import { subscribeOn, tap } from "rxjs/operators"
import { currentContext, effectsMap } from "./constants"
import { HostRef } from "../constants"
import { EffectHandler, EffectMetadata } from "../interfaces"
import { EffectOptions } from "../decorators"
import { DestroyObserver } from "./destroy-observer"
import { Injector } from "@angular/core"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

export function injectAll(...deps: any[]) {
    return deps
}

export function noop() {}

export function complete(subjects: Subject<any>[]) {
    for (const subject of subjects) {
        subject.complete()
        subject.unsubscribe()
    }
}

export function observe(obj: any, isDevMode: boolean) {
    const ownProperties = Object.getOwnPropertyNames(obj)
    const observer: any = {}
    const subjects: Subject<any>[] = []
    const dispose = () => complete(subjects)

    for (const key of ownProperties) {
        let value: any = obj[key]
        const valueSubject: Subject<any> = new Subject()
        const propertyObserver: any = concat(
            defer(() => of(value)),
            valueSubject,
        )

        subjects.push(valueSubject)
        propertyObserver.changes = valueSubject.asObservable()

        observer[key] = propertyObserver
        Object.defineProperty(obj, key, {
            configurable: false,
            enumerable: true,
            get() {
                return value
            },
            set(_value) {
                value = _value
                valueSubject.next(value)
            },
        })
    }

    if (isDevMode && typeof Proxy !== "undefined") {
        const { proxy, revoke } = Proxy.revocable(observer, {
            get(target: any, p: string) {
                if (!target[p]) {
                    throwMissingPropertyError(p, obj.constructor.name)
                }
                return target[p]
            },
        })
        return {
            proxy,
            revoke: () => {
                revoke()
                dispose()
            },
        }
    } else {
        return {
            proxy: observer,
            revoke: dispose,
        }
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
                            return
                        }
                        // first set the value
                        if (options.apply) {
                            for (const prop of Object.keys(value)) {
                                if (!hostContext.hasOwnProperty(prop)) {
                                    throwMissingPropertyError(prop, hostContext.constructor.name)
                                }
                                hostContext[prop] = value[prop]
                            }
                        } else if (hostContext.hasOwnProperty(binding)) {
                            hostContext[binding] = value
                        }
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
    injector: Injector,
    ...effects: any[]
): EffectMetadata[] {
    const hostContext = hostRef.instance
    const { proxy, revoke } = observe(hostContext, isDevMode)
    const defaultOptions = Object.assign(
        {
            whenRendered: false,
            detectChanges: false,
            markDirty: false,
        },
        options,
    )
    destroyObserver.destroyed.subscribe(revoke)

    return Array.from(
        exploreEffects(defaultOptions, proxy, hostContext, strictMode, injector, [
            hostRef.instance,
            ...effects,
        ]),
    )
}

export function* exploreEffects(
    defaultOptions: EffectOptions,
    proxy: any,
    hostContext: any,
    strictMode: boolean,
    injector: Injector,
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
                const options: EffectOptions<any> = Object.assign({}, defaultOptions, maybeOptions)
                const binding = strictMode ? options.bind : options.bind || key
                const checkBinding = options.bind

                if (options.adapter) {
                    adapter = injector.get(options.adapter)
                }

                if (
                    typeof checkBinding === "string" &&
                    Object.getOwnPropertyDescriptor(hostContext, checkBinding) === undefined
                ) {
                    throwMissingPropertyError(checkBinding, hostContext.constructor.name)
                }

                yield {
                    name: effect.constructor.name,
                    key,
                    binding,
                    effect: effectFn.bind(effect, proxy, hostContext),
                    options,
                    adapter,
                }
            }
        }
    }
}
