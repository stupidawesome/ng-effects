import {
    addEffect,
    flushInvalidations,
    getContext,
    reactiveFactory,
    setExecutionContext,
    targetSymbol,
    toRaw,
    unsubscribe,
} from "./connect"
import { Observable, PartialObserver, TeardownLogic } from "rxjs"
import {
    distinctUntilChanged,
    mergeMap,
    pairwise,
    startWith,
} from "rxjs/operators"
import { OnInvalidateFn } from "./interfaces"

function createStopper(
    effect: Function,
    subscribe: (
        teardown: (
            subscriber: PartialObserver<any>,
            start: () => TeardownLogic,
        ) => () => void,
    ) => void,
): Function {
    let observer: PartialObserver<any>

    function stop() {
        if (observer && observer.closed !== true) {
            observer.complete!()
        }
        flushInvalidations(effect)
    }

    subscribe((subscriber, callback) => {
        stop()
        observer = subscriber
        setExecutionContext(effect)
        const teardown = callback()
        setExecutionContext()
        return function () {
            stop()
            unsubscribe(teardown)
        }
    })

    return stop
}

export function context<T extends object>(): T {
    return getContext<T>()
}

export function rawContext<T extends object>(): T {
    return toRaw(getContext<T>())
}

export function reactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value, { shallow: false })
}

export function shallowReactive<T extends object>(value: T): T {
    return reactiveFactory(getContext(), value)
}

export function watchEffect(runEffect: () => TeardownLogic) {
    return createStopper(runEffect, (subscribe) => {
        addEffect(
            (subscriber) =>
                new Observable(() => {
                    return subscribe(subscriber, () => runEffect())
                }).subscribe(),
            { watch: true },
        )
    })
}

export function watch<T>(
    source: Observable<T>,
    runEffect: (currentValue: T, previousValue: T | undefined) => TeardownLogic,
) {
    return createStopper(runEffect, (subscribe) => {
        addEffect((subscriber) =>
            source
                .pipe(
                    distinctUntilChanged(),
                    startWith(undefined),
                    pairwise(),
                    mergeMap(
                        ([previous, current]) =>
                            new Observable(() => {
                                return subscribe(subscriber, () =>
                                    runEffect(current!, previous),
                                )
                            }),
                    ),
                )
                .subscribe(),
        )
    })
}

export function on<T>(
    source: Observable<T>,
    runEffect: (value: T) => TeardownLogic,
) {
    return createStopper(runEffect, (subscribe) => {
        addEffect((subscriber) =>
            source
                .pipe(
                    mergeMap((value) => {
                        return new Observable(() => {
                            return subscribe(subscriber, () => runEffect(value))
                        })
                    }),
                )
                .subscribe(),
        )
    })
}

export function effect(runEffect: () => TeardownLogic) {
    return createStopper(runEffect, (subscribe) => {
        addEffect((subscriber) =>
            new Observable(() => {
                return subscribe(subscriber, () => runEffect())
            }).subscribe(),
        )
    })
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) === value
}
