import { ChangeDetectorRef, Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { noop, unsubscribe } from "./internals/utils"
import { RenderApi } from "./internals/interfaces"

export const isNgEffectsHook = Symbol()

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi, OnDestroy {
    private readonly begin: Subject<void>
    private readonly end: Subject<void>

    constructor(rendererFactory: RendererFactory2) {
        const origFactory = rendererFactory.createRenderer
        const origBeginFn = rendererFactory.begin || noop
        const origEndFn = rendererFactory.end || noop
        const begin = new Subject<void>()
        const end = new Subject<void>()

        rendererFactory.createRenderer = function(hostElement: any, type: any | null) {
            if (hostElement && type) {
                if (!type.doCheck || !type.doCheck[isNgEffectsHook]) {
                    const origDoCheck = type.doCheck
                    type.doCheck = function doCheckHook(this: any) {
                        if (origDoCheck) {
                            origDoCheck.apply(this, arguments)
                        }
                        begin.next()
                    }
                    type.doCheck[isNgEffectsHook] = true
                }
            }
            return origFactory.call(rendererFactory, hostElement, type)
        }

        rendererFactory.begin = function() {
            origBeginFn.apply(rendererFactory)
            begin.next()
        }

        rendererFactory.end = function() {
            origEndFn.apply(rendererFactory)
            end.next()
        }

        this.end = end
        this.begin = begin
    }

    public detectChanges(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.detectChanges()
    }

    public markDirty(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.markForCheck()
    }

    public whenScheduled() {
        return this.begin.asObservable()
    }

    public whenRendered() {
        return this.end.asObservable()
    }

    public ngOnDestroy() {
        unsubscribe([this.begin, this.end])
    }
}
