import { ChangeDetectorRef, Injectable, RendererFactory2 } from "@angular/core"
import { noop, Observable, Subject } from "rxjs"
import { RenderApi } from "./interfaces"
import { share } from "rxjs/operators"

export const isNgEffectsHook = Symbol()

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi {
    whenScheduled: Observable<any>
    whenRendered: Observable<any>

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

        rendererFactory.end = function() {
            end.next()
            origEndFn.apply(rendererFactory)
        }

        this.whenScheduled = begin.pipe(share())

        this.whenRendered = end.pipe(share())
    }

    public detectChanges(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.detectChanges()
    }

    public markDirty(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.markForCheck()
    }
}
