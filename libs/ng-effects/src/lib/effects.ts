import { ChangeDetectorRef, Inject, Injectable, OnDestroy } from "@angular/core"
import { Observable, Subscription } from "rxjs"
import { tap } from "rxjs/operators"
import { EFFECTS } from "./constants"
import { effectsMap } from "./internals/constants"
import { dispose, takeUntilDestroy } from "./utils"
import { observe } from "./internals/utils"

export function bindEffects(obj: any, effects: Effects) {
    const ownProperties = Object.getOwnPropertyNames(obj)
    const observer: any = observe(obj, ownProperties)

    for (const name of ownProperties) {
        let value: any
        const propertyObserver = observer[name]
        Object.defineProperty(obj, name, {
            get() {
                return value
            },
            set(_value) {
                if (value !== _value) {
                    value = _value
                    propertyObserver.next(value)
                }
            },
        })
    }

    Effects.run(effects, obj, observer)

    return obj
}

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private instance: object | null

    static run(effects: Effects, instance: any, observer: any) {
        effects.run(instance, observer)
    }

    constructor(@Inject(EFFECTS) private effects: any[], private cdr: ChangeDetectorRef) {
        this.subs = new Subscription()
        this.instance = null
    }

    public bind(instance: any) {
        return bindEffects(instance, this)
    }

    private run(instance: any, observer: any) {
        this.instance = instance
        for (const effect of this.effects) {
            const props = [
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
                ...Object.getOwnPropertyNames(effect)
            ]
            for (const key of props) {
                const fn = effect[key]
                const options = effectsMap.get(fn)
                if (fn && options) {
                    let returnValue = fn.call(effect, observer, instance)
                    if (returnValue) {
                        if (returnValue instanceof Observable) {
                            returnValue = returnValue.pipe(
                                takeUntilDestroy(instance),
                            )
                            if (options.markDirty) {
                                returnValue = returnValue.pipe(
                                    tap(() => this.cdr.markForCheck())
                                )
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
