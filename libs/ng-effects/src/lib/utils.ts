import {
    addEffect,
    getContext,
    reactiveFactory,
    targetSymbol,
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
    fn: (
        teardown: (
            subscriber: PartialObserver<any>,
            start: () => TeardownLogic,
        ) => () => void,
        onInvalidate: OnInvalidateFn,
    ) => void,
): Function {
    let observer: PartialObserver<any>
    const invalidations: TeardownLogic[] = []

    function onInvalidate(fn: TeardownLogic) {
        invalidations.push(fn)
    }

    function stop() {
        if (observer && observer.closed !== true) {
            observer.complete!()
        }
        for (const invalidation of invalidations) {
            unsubscribe(invalidation)
        }
        invalidations.length = 0
    }

    fn((subscriber, start) => {
        stop()
        observer = subscriber
        const teardown = start()
        return function () {
            stop()
            unsubscribe(teardown)
        }
    }, onInvalidate)

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

export function watchEffect(
    fn: (onInvalidate: OnInvalidateFn) => TeardownLogic,
) {
    return createStopper((teardown, onInvalidate) => {
        addEffect(
            (subscriber) =>
                new Observable(() => {
                    return teardown(subscriber, () => fn(onInvalidate))
                }).subscribe(),
            { watch: true },
        )
    })
}

export function watch<T>(
    source: Observable<T>,
    fn: (
        currentValue: T,
        previousValue: T | undefined,
        onInvalidate: OnInvalidateFn,
    ) => TeardownLogic,
) {
    return createStopper((subscribe, onInvalidate) => {
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
                                    fn(current!, previous, onInvalidate),
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
    fn: (value: T, onInvalidate: OnInvalidateFn) => TeardownLogic,
) {
    return createStopper((teardown, onInvalidate) => {
        addEffect((subscriber) =>
            source
                .pipe(
                    mergeMap((value) => {
                        return new Observable(() => {
                            teardown(subscriber, () => fn(value, onInvalidate))
                        })
                    }),
                )
                .subscribe(),
        )
    })
}

export function effect(fn: (onInvalidate: OnInvalidateFn) => TeardownLogic) {
    return createStopper((teardown, onInvalidate) => {
        addEffect((subscriber) =>
            new Observable(() => {
                return teardown(subscriber, () => fn(onInvalidate))
            }).subscribe(),
        )
    })
}

export function isProxy(value: any) {
    return Reflect.get(value, targetSymbol) === value
}

export function toRaw<T extends object>(value: T): T {
    return Reflect.get(value, targetSymbol) || value
}
