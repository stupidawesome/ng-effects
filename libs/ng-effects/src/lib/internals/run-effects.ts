import { ChangeDetectorRef, ElementRef, Host, Inject, Injectable } from "@angular/core"
import { asapScheduler, isObservable, merge, partition, Subject } from "rxjs"
import { EFFECTS, HostRef } from "../constants"
import { ViewRenderer } from "./view-renderer"
import { EffectMetadata } from "../interfaces"
import { filter, observeOn, take } from "rxjs/operators"
import { assertPropertyExists, isTeardownLogic, throwBadReturnTypeError } from "./utils"
import { globalNotifier } from "./constants"
import { DestroyObserver } from "./destroy-observer"
import { InternalHostRef } from "./interfaces"

export function effectsRunner(
    effectsMetadata: EffectMetadata[],
    hostRef: InternalHostRef,
    observer: DestroyObserver,
    notifier: Subject<any>,
) {
    let whenRendered = false
    return function runEffects() {
        for (const metadata of effectsMetadata) {
            if (metadata.options.whenRendered === whenRendered) {
                runEffect(hostRef, metadata, observer, notifier)
            }
        }
        hostRef.update()
        whenRendered = true
    }
}

function runEffect(
    hostRef: InternalHostRef,
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

@Injectable()
export class RunEffects {
    constructor(
        @Host() @Inject(HostRef) hostRef: InternalHostRef,
        @Host() @Inject(EFFECTS) effectsMetadata: EffectMetadata[],
        @Host() elementRef: ElementRef,
        @Host() changeDetector: ChangeDetectorRef,
        @Host() destroyObserver: DestroyObserver,
        viewRenderer: ViewRenderer,
    ) {
        const nativeElement = elementRef.nativeElement
        const whenRendered = viewRenderer.whenRendered().pipe(take(1))
        const changeNotifier = new Subject<any>()
        const events = globalNotifier.pipe(filter(element => element === nativeElement))
        const scheduler = merge(viewRenderer.whenScheduled(), viewRenderer.whenRendered(), events)
        const [asyncChanges, syncChanges] = partition(changeNotifier, opts =>
            Boolean(opts && opts.markDirty),
        )
        const runEffects = effectsRunner(effectsMetadata, hostRef, destroyObserver, changeNotifier)

        // Start event loop
        destroyObserver.add(
            hostRef.observer,
            whenRendered.subscribe(runEffects),
            scheduler.subscribe(hostRef),
            syncChanges.subscribe(opts => {
                if (opts && opts.detectChanges) {
                    viewRenderer.detectChanges(hostRef, changeDetector)
                } else {
                    hostRef.next()
                }
            }),
            asyncChanges.pipe(observeOn(asapScheduler)).subscribe(() => {
                viewRenderer.markDirty(hostRef, changeDetector)
            }),
            destroyObserver.destroyed.subscribe(changeNotifier),
        )

        runEffects()
    }
}
