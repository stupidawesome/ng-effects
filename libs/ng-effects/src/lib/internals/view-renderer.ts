import { ChangeDetectorRef, Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { noop } from "./utils"
import { RenderApi } from "./interfaces"

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi, OnDestroy {
    private readonly begin: Subject<null>
    private readonly end: Subject<null>

    constructor(rendererFactory: RendererFactory2) {
        const origBeginFn = rendererFactory.end || noop
        const origEndFn = rendererFactory.end || noop
        const begin = new Subject<null>()
        const end = new Subject<null>()
        const observers = end.observers

        rendererFactory.begin = function() {
            origBeginFn.apply(rendererFactory)
            if (observers.length > 0) {
                begin.next(null)
            }
        }

        rendererFactory.end = function() {
            origEndFn.apply(rendererFactory)
            if (observers.length > 0) {
                end.next(null)
            }
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
        this.end.complete()
    }
}
