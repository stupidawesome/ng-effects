import { ChangeDetectorRef, ElementRef } from "@angular/core"
import { asapScheduler, isObservable, merge, partition, Subject } from "rxjs"
import { ViewRenderer } from "./view-renderer"
import { EffectMetadata } from "../interfaces"
import { observeOn, take } from "rxjs/operators"
import { assertPropertyExists, isTeardownLogic, throwBadReturnTypeError } from "./utils"
import { DestroyObserver } from "./destroy-observer"
import { HostRef } from "./host-ref"

export function effectsRunner(
    effectsMetadata: EffectMetadata[],
    hostRef: HostRef,
    observer: DestroyObserver,
    notifier: Subject<any>,
) {
    let whenRendered = false
    return function runEffects() {
        hostRef.update()
        for (const metadata of effectsMetadata) {
            if (metadata.options.whenRendered === whenRendered) {
                runEffect(hostRef, metadata, observer, notifier)
            }
        }
        whenRendered = true
    }
}

function runEffect(
    hostRef: HostRef,
    metadata: EffectMetadata,
    observer: DestroyObserver,
    notifier: Subject<any>,
) {
    const { context, state } = hostRef
    const returnValue = metadata.method.call(metadata.target, state, context)

    if (returnValue === undefined) {
        return
    } else if (isObservable(returnValue)) {
        observer.add(
            returnValue.subscribe((value: any) => {
                const { assign, bind } = metadata.options

                if (metadata.adapter) {
                    metadata.adapter.next(value, metadata.options, metadata)
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

                notifier.next(metadata.options)
            }),
        )
    } else if (isTeardownLogic(returnValue)) {
        observer.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
}

export function runEffects(
    effectsMetadata: EffectMetadata[],
    hostRef: HostRef,
    elementRef: ElementRef,
    changeDetector: ChangeDetectorRef,
    destroyObserver: DestroyObserver,
    viewRenderer: ViewRenderer,
) {
    const whenRendered = viewRenderer.whenRendered().pipe(take(1))
    const changeNotifier = new Subject<any>()
    const scheduler = merge(
        viewRenderer.whenScheduled(),
        viewRenderer.whenRendered(),
        changeNotifier,
    )
    const [asyncChanges, syncChanges] = partition(scheduler, opts =>
        Boolean(opts && opts.markDirty),
    )
    const runEffects = effectsRunner(effectsMetadata, hostRef, destroyObserver, changeNotifier)

    // Start event loop
    destroyObserver.add(
        hostRef.observer,
        whenRendered.subscribe(runEffects),
        syncChanges.subscribe(opts => {
            if (opts && opts.detectChanges) {
                viewRenderer.detectChanges(hostRef, changeDetector)
            } else {
                hostRef.tick()
            }
        }),
        asyncChanges.pipe(observeOn(asapScheduler)).subscribe(() => {
            viewRenderer.markDirty(hostRef, changeDetector)
        }),
        destroyObserver.destroyed.subscribe(changeNotifier),
    )

    runEffects()
}
