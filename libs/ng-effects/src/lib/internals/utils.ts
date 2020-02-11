import { concat, defer, isObservable, of, Subject, TeardownLogic } from "rxjs"
import { InitEffectArgs } from "./interfaces"
import { distinctUntilChanged, skipUntil, tap } from "rxjs/operators"

export function throwMissingPropertyError(key: string, name: string) {
    throw new Error(`[ng-effects] Property "${key}" is not initialised in "${name}".`)
}

export function noop() {}

export function complete(subjects: Subject<any>[]) {
    for (const subject of subjects) {
        subject.complete()
        subject.unsubscribe()
    }
}

export function flat<T>(array: T[], depth?: number): T[] {
    return Array.from(flatten(array, depth))
}

export function* flatten<T>(array: T[], depth?: number): IterableIterator<T> {
    if (depth === undefined) depth = 1
    for (const item of array) {
        if (Array.isArray(item) && depth > 0) {
            yield* flatten(item as any, depth - 1)
        } else {
            yield item
        }
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

export function initEffect({
    effect,
    effectFn,
    binding,
    options,
    cdr,
    proxy,
    hostContext,
    subs,
    viewRenderer,
    whenRendered,
}: InitEffectArgs) {
    const returnValue = effectFn.call(effect, proxy, hostContext)

    if (returnValue === undefined) {
        return
    }

    if (isObservable(returnValue)) {
        const pipes: any = [distinctUntilChanged()]
        // first set the value
        if (options.apply) {
            pipes.push(
                tap((values: any) => {
                    for (const key of Object.keys(values)) {
                        if (!hostContext.hasOwnProperty(key)) {
                            throwMissingPropertyError(key, hostContext.constructor.name)
                        }
                        hostContext[key] = values[key]
                    }
                }),
            )
        } else if (hostContext.hasOwnProperty(binding)) {
            pipes.push(tap((value: any) => (hostContext[binding] = value)))
        }
        // wait until first change detection
        pipes.push(skipUntil(whenRendered))
        // markDirty or detect changes
        if (options.detectChanges) {
            pipes.push(tap(() => viewRenderer.detectChanges(hostContext, cdr)))
        } else if (options.markDirty) {
            pipes.push(tap(() => viewRenderer.markDirty(hostContext, cdr)))
        }
        subs.add(returnValue.pipe.apply(returnValue, pipes).subscribe())
    } else if (isTeardownLogic(returnValue)) {
        subs.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
}
