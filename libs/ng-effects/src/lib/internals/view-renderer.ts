import { ChangeDetectorRef, Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { noop, unsubscribe } from "./utils"
import { RenderApi } from "./interfaces"

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi, OnDestroy {
    private readonly begin: Subject<void>
    private readonly end: Subject<void>

    constructor(rendererFactory: RendererFactory2) {
        const origBeginFn = rendererFactory.end || noop
        const origEndFn = rendererFactory.end || noop
        const begin = new Subject<void>()
        const end = new Subject<void>()

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
