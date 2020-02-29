import { ChangeDetectorRef, Injector, NgZone, ViewContainerRef } from "@angular/core"
import { isObservable, Subject } from "rxjs"
import { ViewRenderer } from "../view-renderer"
import {
    CreateEffectAdapter,
    NextEffectAdapter,
    EffectMetadata,
    EffectOptions,
} from "../interfaces"
import { take } from "rxjs/operators"
import { assertPropertyExists, isTeardownLogic, throwBadReturnTypeError } from "./utils"
import { DestroyObserver } from "./destroy-observer"
import { HostRef } from "./host-ref"
import { globalDefaults } from "./constants"
import { effectMetadata } from "./explore-effects"
import { HostEmitter } from "../host-emitter"

function effectRunner(
    hostRef: HostRef,
    observer: DestroyObserver,
    notifier: Subject<any>,
    injector: Injector,
    parentInjector?: Injector,
) {
    let whenRendered = false
    return function runEffects() {
        hostRef.tick()
        for (const [type, effects] of effectMetadata) {
            let effect, maybeParent, maybeEffect
            if (hostRef.context instanceof type) {
                effect = hostRef.context
            } else {
                // Workaround for (#3), if the same effect instance is
                // present in both the current and parent injectors
                // then it the service was not provided in the current
                // component, so it should be skipped.
                try {
                    maybeParent = parentInjector && parentInjector.get(type, null)
                } catch (e) {
                    throw new Error(
                        `[ng-effects] ${type.name} cannot be created because of a dangling provider in a parent injector. See https://github.com/stupidawesome/ng-effects/issues/3 for more details.`,
                    )
                }
                maybeEffect = injector.get(type, null)
                effect = maybeParent !== maybeEffect && maybeEffect
            }

            if (effect) {
                for (const metadata of effects) {
                    if (metadata.options.whenRendered === whenRendered) {
                        const maybeAdapter = metadata.options.adapter
                        const adapter = maybeAdapter && injector.get(maybeAdapter)
                        runEffect(hostRef, metadata, observer, notifier, effect, adapter)
                    }
                }
            }
        }
        whenRendered = true
    }
}

function sortArguments(arr: number[], index: number[], n: number) {
    const temp: number[] = Array.from({ length: 3 })
    for (let i = 0; i < n; i++) {
        temp[index[i]] = arr[i]
    }
    for (let i = 0; i < n; i++) {
        if (temp[i] !== undefined) {
            arr[i] = temp[i]
        }
    }
    return arr
}

function runEffect(
    hostRef: HostRef,
    metadata: EffectMetadata,
    destroy: DestroyObserver,
    notifier: Subject<any>,
    effect: any,
    adapter?: NextEffectAdapter<any> & CreateEffectAdapter<any>,
) {
    const { context, state, observer } = hostRef
    const { args, name, options, path } = metadata
    const sortedArgs = sortArguments([state, context, observer], args, 3)
    let returnValue = effect[name].apply(effect, sortedArgs)

    if (adapter && adapter.create) {
        returnValue = adapter.create(returnValue, metadata)
    }

    if (returnValue === undefined) {
        return
    }

    if (hostRef.context[metadata.options.bind] instanceof HostEmitter) {
        destroy.add(returnValue.subscribe(hostRef.context[metadata.options.bind]))
        return
    }

    if (isObservable(returnValue)) {
        destroy.add(
            returnValue.subscribe({
                next(value: any) {
                    const { assign, bind } = options

                    if (adapter && adapter.next) {
                        adapter.next(value, metadata)
                    }

                    if (assign) {
                        for (const prop of Object.keys(value)) {
                            assertPropertyExists(prop, context)
                            context[prop] = value[prop]
                        }
                    } else if (bind) {
                        assertPropertyExists(bind, context)
                        context[bind] = value
                    }

                    notifier.next(options)
                },
                error(error: any) {
                    console.error(`[ng-effects] Uncaught error in effect: ${path}`)
                    console.error(error)
                },
            }),
        )
    } else if (isTeardownLogic(returnValue)) {
        destroy.add(returnValue)
    } else {
        throwBadReturnTypeError(metadata.path)
    }
}

export function runEffects(
    effectsMetadata: EffectMetadata[],
    hostRef: HostRef,
    destroyObserver: DestroyObserver,
    viewRenderer: ViewRenderer,
    parentRef: HostRef,
    injector: Injector,
    changeDetector?: ChangeDetectorRef,
    viewContainerRef?: ViewContainerRef,
) {
    let createMode = true
    const changeNotifier = new Subject<any>()
    const rendered = viewRenderer.whenRendered().pipe(take(1))
    const scheduled = viewRenderer.whenScheduled()

    // noinspection JSDeprecatedSymbols
    const runEffects = effectRunner(
        hostRef,
        destroyObserver,
        changeNotifier,
        injector,
        viewContainerRef && viewContainerRef.parentInjector,
    )

    const detectChanges = async function(opts: EffectOptions = globalDefaults) {
        hostRef.tick()
        if (parentRef) {
            parentRef.tick()
        }
        if (!changeDetector) {
            return
        }
        if (opts.detectChanges) {
            viewRenderer.detectChanges(hostRef.context, changeDetector)
        } else if (opts.markDirty) {
            // async workaround for "noop" zone
            if (createMode || !NgZone.isInAngularZone()) {
                await Promise.resolve()
            }
            if (!destroyObserver.isDestroyed) {
                viewRenderer.markDirty(hostRef.context, changeDetector)
            }
        }
    }

    // Start event loop
    destroyObserver.add(
        scheduled.subscribe(changeNotifier),
        rendered.subscribe(runEffects),
        changeNotifier.subscribe(detectChanges),
    )

    runEffects()
    createMode = false
}
