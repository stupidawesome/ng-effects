import { APP_ID, Inject, Injectable, InjectionToken, Injector, Renderer2 } from "@angular/core"
import { EventManager, ɵDomRendererFactory2, ɵDomSharedStylesHost } from "@angular/platform-browser"
import { __effect__, markDirtyOn, takeUntilDestroy } from "../reactive-component"
import { asapScheduler, NEVER, Observable, Subscription } from "rxjs"
import { subscribeOn } from "rxjs/operators"


export function initEffects(instance, effects, observer) {
    const subs = takeUntilDestroy(this)(NEVER).subscribe(() => {
        subs.unsubscribe()
    })

    for (const effect of effects.map(m => new m)) {
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(effect))) {
            const value = effect[key]
            const options = value[__effect__]
            if (value && options) {
                let returnValue = value(observer, instance)
                if (returnValue) {
                    if (returnValue instanceof Observable) {
                        returnValue = returnValue.pipe(
                            subscribeOn(asapScheduler),
                            takeUntilDestroy(instance)
                        )

                        if (options.markDirty) {
                            returnValue = returnValue.pipe(
                                markDirtyOn(instance)
                            )
                        }
                        observer[key] = returnValue
                    }
                    if (returnValue instanceof Subscription) {
                        subs.add(returnValue)
                    }
                }
            }
        }
    }
}

export const COMP = new InjectionToken("COMP")

@Injectable()
export class MyRendererFactory2 extends ɵDomRendererFactory2 {
    private injector: Injector
    constructor(injector: Injector, eventManager: EventManager, sharedStylesHost: ɵDomSharedStylesHost, @Inject(APP_ID) appId: string) {
        super(eventManager, sharedStylesHost, appId)
        this.injector = injector
    }
    createRenderer(element: any, type: any): Renderer2 {
        const renderer = super.createRenderer(element, type)
        if (!element || !type) {
            return renderer
        }

        return renderer
    }
}
