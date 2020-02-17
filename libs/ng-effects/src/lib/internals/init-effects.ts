import { ChangeDetectorRef, ElementRef, Host, Inject, Injectable } from "@angular/core"
import { asapScheduler, BehaviorSubject, isObservable, merge, Subject } from "rxjs"
import { EFFECTS, HostRef } from "../constants"
import { ViewRenderer } from "./view-renderer"
import { DefaultEffectOptions, EffectMetadata, State } from "../interfaces"
import { filter, observeOn, take, takeUntil, tap } from "rxjs/operators"
import { assertPropertyExists, isTeardownLogic, state, throwBadReturnTypeError } from "./utils"
import { globalNotifier } from "./constants"
import { DestroyObserver } from "./destroy-observer"

export function initEffects(state: State<any>, whenRendered: boolean) {
    return function(
        hostContext: any,
        effectsMetadata: EffectMetadata[],
        observer: DestroyObserver,
        notifier: Subject<any>,
    ) {
        for (const metadata of effectsMetadata) {
            if (metadata.options.whenRendered === whenRendered) {
                const returnValue = metadata.method.call(metadata.target, state, hostContext)

                if (returnValue === undefined) {
                    continue
                }

                if (isObservable(returnValue)) {
                    returnValue
                        .pipe(takeUntil(observer.destroyed))
                        .subscribe(value => handleEffect(value, hostContext, metadata, notifier))
                } else if (isTeardownLogic(returnValue)) {
                    observer.add(returnValue)
                } else {
                    throwBadReturnTypeError()
                }
            }
        }
    }
}

export function handleEffect(
    value: any,
    hostContext: any,
    metadata: EffectMetadata,
    notifier: Subject<any>,
) {
    const { assign, bind } = metadata.options
    let dirty = false

    if (metadata.adapter) {
        metadata.adapter.next(value, metadata.options, metadata)
    }
    if (assign) {
        for (const prop of Object.keys(value)) {
            assertPropertyExists(prop, hostContext)
            if (hostContext[prop] !== value[prop]) {
                hostContext[prop] = value[prop]
                dirty = true
            }
        }
    } else if (bind) {
        assertPropertyExists(bind, hostContext)
        if (hostContext[bind] !== value) {
            hostContext[bind] = value
            dirty = true
        }
    }
    if (dirty) {
        notifier.next(metadata.options)
    }
}

@Injectable()
export class InitEffects {
    constructor(
        @Host() hostRef: HostRef,
        @Host() @Inject(EFFECTS) effectsMetadata: EffectMetadata[],
        @Host() cdr: ChangeDetectorRef,
        viewRenderer: ViewRenderer,
        elementRef: ElementRef,
        changeDetector: ChangeDetectorRef,
        destroyObserver: DestroyObserver,
    ) {
        const hostContext = hostRef.instance
        const whenRendered = viewRenderer.whenRendered().pipe(take(1))
        const nativeElement = elementRef.nativeElement
        const notifier = new BehaviorSubject<any>(hostContext)
        const events = globalNotifier.pipe(filter(element => element === nativeElement))
        const changeNotifier = new Subject<DefaultEffectOptions>()

        const scheduler = merge(viewRenderer.whenScheduled(), viewRenderer.whenRendered(), events)

        changeNotifier
            .pipe(
                tap(({ detectChanges, markDirty }) => {
                    if (detectChanges) {
                        viewRenderer.detectChanges(hostContext, changeDetector)
                    } else if (!markDirty) {
                        notifier.next(hostContext)
                    }
                }),
                observeOn(asapScheduler),
            )
            .subscribe(({ markDirty }) => {
                if (markDirty) {
                    viewRenderer.markDirty(hostContext, changeDetector)
                }
            })

        const args: any = [hostContext, effectsMetadata, destroyObserver, changeNotifier]

        initEffects(state(notifier, hostContext), false).apply(null, args)

        whenRendered.subscribe(() => {
            initEffects(state(notifier, hostContext), true).apply(null, args)
        })

        // Start event loop
        destroyObserver.add(
            notifier,
            changeNotifier,
            scheduler.subscribe(() => notifier.next(hostContext)),
        )
    }
}
