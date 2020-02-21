import { BehaviorSubject, NEVER, Observable, TeardownLogic } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"
import { DefaultEffectOptions, EffectMetadata, State } from "../interfaces"
import { HostRef } from "../constants"
import { Injector } from "@angular/core"
import { defaultOptions } from "./constants"
import { exploreEffects } from "./explore-effects"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

function selectKey(source: Observable<any>, key: PropertyKey) {
    return source.pipe(
        map(value => value[key]),
        distinctUntilChanged(),
    )
}

const stateMap = new WeakMap()

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
        return mapState(source, target)
    }
}

export function mapState<T>(source: Observable<T>, target: any) {
    const state = stateMap.get(target) || stateMap.set(target, {}).get(target)
    const keys = Object.getOwnPropertyNames(target)

    for (const key of keys) {
        state[key] = selectKey(source, key)
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

export function createHostRef(mapState: Function) {
    let context: any,
        state: State<any> = {},
        observer: BehaviorSubject<any>
    return {
        get context() {
            return context
        },
        get state() {
            return state
        },
        get observer() {
            return observer
        },
        update(value: any) {
            context = context || value
            observer = observer || new BehaviorSubject(context)
            state = mapState(observer, context)
        },
        next() {
            observer.next(context)
        },
    }
}

export function assertPropertyExists(key: any, obj: any) {
    if (typeof key === "string" && Object.getOwnPropertyDescriptor(obj, key) === undefined) {
        throwMissingPropertyError(key, obj.constructor.name)
    }
}

export function injectEffectsFactory(effects: any | any[], options?: DefaultEffectOptions) {
    return function injectEffects(hostRef: HostRef, injector: Injector): EffectMetadata[] {
        const hostContext = hostRef.context
        const hostType = Object.getPrototypeOf(hostContext).constructor
        const defaults = Object.assign({}, defaultOptions, options)

        return [...exploreEffects(defaults, hostContext, hostType, injector, [].concat(effects))]
    }
}
