import { HostRef } from "../connect/host-ref"
import { DestroyObserver } from "../connect/destroy-observer"
import { ViewRenderer } from "./view-renderer"
import { asapScheduler, Subject } from "rxjs"
import { EffectOptions } from "../lib/interfaces"
import { ChangeDetectorRef, NgZone } from "@angular/core"
import { subscribeOn } from "rxjs/operators"
import { ChangeNotifier } from "../connect/change-notifier"

export function scheduler(
    hostRef: HostRef,
    destroyObserver: DestroyObserver,
    viewRenderer: ViewRenderer,
    parent: ChangeNotifier,
    changeNotifier: Subject<EffectOptions | void>,
    changeDetector?: ChangeDetectorRef,
) {
    const noopZone = !NgZone.isInAngularZone()
    const scheduled = viewRenderer.whenScheduled

    const detectChanges = async function(opts: EffectOptions | void) {
        if (!opts || !changeDetector) {
            return
        }
        if (opts.detectChanges) {
            viewRenderer.detectChanges(hostRef.context, changeDetector)
        } else if (opts.markDirty) {
            // async workaround for "noop" zone
            if (noopZone) {
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
        changeNotifier.subscribe(() => {
            hostRef.tick()
            if (parent) {
                parent.next()
            }
        }),
        changeNotifier.pipe(subscribeOn(asapScheduler)).subscribe(detectChanges),
    )
}
