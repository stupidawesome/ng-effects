import { EMPTY, Observable, TeardownLogic } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"
import { currentContext } from "./constants"

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
                    return EMPTY
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

export function assertPropertyExists(key: any, obj: any) {
    if (typeof key === "string" && Object.getOwnPropertyDescriptor(obj, key) === undefined) {
        throwMissingPropertyError(key, obj.constructor.name)
    }
}
