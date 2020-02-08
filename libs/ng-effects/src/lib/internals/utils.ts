import {
    concat,
    defer,
    isObservable,
    MonoTypeOperatorFunction,
    of,
    Subject,
    Subscription,
} from "rxjs"
import { EffectOptions } from "../decorators"
import { ChangeDetectorRef, Injector } from "@angular/core"
import { detectChangesOn, markDirtyOn } from "../utils"
import { pipeFromArray } from "rxjs/internal/util/pipe"
import { Connect } from "../providers"
import { HOST_CONTEXT } from "../constants"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

export function injectAll(...deps: any[]) {
    return deps
}

export function noop() {}

export function observe(obj: any, isDevMode: boolean) {
    const ownProperties = Object.getOwnPropertyNames(obj)
    const observer: any = {}

    for (const key of ownProperties) {
        let value: any = obj[key]
        const valueSubject: Subject<any> = new Subject()
        const propertyObserver: any = concat(
            defer(() => of(value)),
            valueSubject,
        )
        propertyObserver.changes = valueSubject.asObservable()

        observer[key] = propertyObserver
        Object.defineProperty(obj, key, {
            get() {
                return value
            },
            set(_value) {
                if (value !== _value) {
                    value = _value
                    valueSubject.next(value)
                }
            },
        })
    }

    if (isDevMode && typeof Proxy !== "undefined") {
        return Proxy.revocable(observer, {
            get(target: any, p: string) {
                if (!target[p]) {
                    throwMissingPropertyError(p, obj.constructor.name)
                }
                return target[p]
            },
        })
    } else {
        return {
            proxy: observer,
            revoke: noop,
        }
    }
}

export function throwBadReturnTypeError() {
    throw new Error("[ng-effects] Effects must return an observable, subscription, or void")
}

export function initEffect(
    effect: Function,
    key: string,
    options: EffectOptions,
    cdr: ChangeDetectorRef,
    observer: any,
    instance: any,
    subs: Subscription,
) {
    const returnValue = effect.call(effect, observer, instance)

    if (returnValue === undefined) {
        return
    }

    if (isObservable(returnValue)) {
        const pipes: MonoTypeOperatorFunction<unknown>[] = []

        if (!instance.hasOwnProperty(key)) {
            throwMissingPropertyError(key, instance.constructor.name)
        }
        if (options.detectChanges) {
            pipes.push(detectChangesOn(cdr))
        } else if (options.markDirty) {
            pipes.push(markDirtyOn(cdr))
        }
        subs.add(
            returnValue.pipe(pipeFromArray(pipes)).subscribe((value: any) => {
                instance[key] = value
            }),
        )
    } else if (returnValue instanceof Subscription) {
        subs.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
}

export function connectFactory<T>(initializers: any[], parentInjector: Injector): Connect {
    function connect(context: any) {
        const injector = Injector.create({
            parent: parentInjector,
            providers: [
                {
                    provide: HOST_CONTEXT,
                    useValue: context,
                },
                ...initializers,
            ],
        })

        initializers.forEach(injector.get, injector)
    }

    return connect
}
