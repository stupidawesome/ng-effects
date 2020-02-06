import { Inject, Injectable, OnDestroy } from "@angular/core"
import { asapScheduler, Observable, Subscription } from "rxjs"
import { subscribeOn } from "rxjs/operators"
import { EFFECTS } from "./constants"
import { effectsMap } from "./internals/constants"
import { dispose, markDirtyOn, takeUntilDestroy } from "./utils"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private instance: object | null

    constructor(@Inject(EFFECTS) private effects: any[]) {
        this.subs = new Subscription()
        this.instance = null
    }

    public run(instance: any, observer: any) {
        this.instance = instance
        for (const effect of this.effects) {
            for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(effect))) {
                const fn = effect[key]
                const options = effectsMap.get(fn)
                if (fn && options) {
                    let returnValue = fn.call(effect, observer, instance)
                    if (returnValue) {
                        if (returnValue instanceof Observable) {
                            returnValue = returnValue.pipe(
                                subscribeOn(asapScheduler),
                                takeUntilDestroy(instance),
                            )
                            if (options.markDirty) {
                                returnValue = returnValue.pipe(markDirtyOn(instance))
                            }
                            observer[key] = returnValue
                        }
                        if (returnValue instanceof Subscription) {
                            this.subs.add(returnValue)
                        }
                    }
                }
            }
        }
    }

    public ngOnDestroy() {
        if (this.instance) {
            dispose(this.instance)
        }
        this.subs.unsubscribe()
    }
}
