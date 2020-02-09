import { concat, defer, isObservable, of, Subject, Subscription, TeardownLogic } from "rxjs"
import { EffectOptions } from "../decorators"
import { ChangeDetectorRef, Host, Inject, Injectable, Injector } from "@angular/core"
import { detectChangesOn, markDirtyOn } from "../utils"
import { HOST_CONTEXT, HOST_INITIALIZER } from "../constants"
import { DestroyObserver } from "./destroy-observer"

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

export function initEffect(
    effect: any,
    effectFn: Function,
    key: string,
    options: EffectOptions,
    cdr: ChangeDetectorRef,
    observer: any,
    instance: any,
    subs: Subscription,
) {
    const returnValue = effectFn.call(effect, observer, instance)

    if (returnValue === undefined) {
        return
    }

    if (isObservable(returnValue)) {
        const pipes: any = []
        if (options.detectChanges) {
            pipes.push(detectChangesOn(cdr))
        } else if (options.markDirty) {
            pipes.push(markDirtyOn(cdr))
        }
        subs.add(
            returnValue.pipe.apply(returnValue, pipes).subscribe((value: any) => {
                if (instance.hasOwnProperty(key)) {
                    instance[key] = value
                }
            }),
        )
    } else if (isTeardownLogic(returnValue)) {
        subs.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
}

@Injectable()
export class ConnectFactory {
    constructor(
        @Host() @Inject(HOST_INITIALIZER) initializers: any[],
        @Host() destroyObserver: DestroyObserver,
        @Host() parentInjector: Injector,
    ) {
        return function connect(context: any) {
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

            initializers.map(injector.get, injector).forEach(instance =>
                destroyObserver.destroyed.subscribe(() => {
                    if (instance.ngOnDestroy) {
                        instance.ngOnDestroy()
                    }
                }),
            )
        }
    }
}
