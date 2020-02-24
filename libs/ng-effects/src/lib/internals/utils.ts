import { NEVER, Observable, TeardownLogic } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"
import { DefaultEffectOptions, EffectMetadata } from "../interfaces"
import { globalDefaults } from "./constants"
import { exploreEffects } from "./explore-effects"
import { HostRef } from "./host-ref"
import { HostEmitter } from "../host-emitter"
import { isDevMode } from "@angular/core"

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
                if (target[key] instanceof HostEmitter) {
                    return target[key]
                } else {
                    return selectKey(source, key)
                }
            },
        })
    }
    if (isDevMode()) {
        console.warn(
            "[ng-effects] This browser does not support Proxy objects. Falling back to Object.getOwnPropertyNames. Dev mode diagnostics will be limited.",
        )
    }
    return mapState(source, target)
}

export function mapState<T>(source: Observable<T>, target: any) {
    const state: any = {}
    const keys = Object.getOwnPropertyNames(target)

    for (const key of keys) {
        if (key.startsWith("__")) {
            continue
        }
        if (target[key] instanceof HostEmitter) {
            state[key] = target[key]
        } else {
            state[key] = selectKey(source, key)
        }
    }

    return state
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

export function assertPropertyExists(key: any, obj: any) {
    if (typeof key === "string" && Object.getOwnPropertyDescriptor(obj, key) === undefined) {
        throwMissingPropertyError(key, obj.constructor.name)
    }
}

export function createEffectsFactory(effects: any | any[], options: DefaultEffectOptions = {}) {
    return function injectEffects(hostRef: HostRef): EffectMetadata[] {
        const hostType = Object.getPrototypeOf(hostRef.context).constructor
        const defaults = Object.assign({}, globalDefaults, options)

        return [...exploreEffects(defaults, [hostType].concat(effects))]
    }
}

export function unsubscribe(subs: any[]) {
    for (const sub of subs) {
        sub.complete && sub.complete()
        sub.unsubscribe && sub.unsubscribe()
        sub.call && sub()
    }
}
