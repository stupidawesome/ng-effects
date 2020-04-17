import { ChangeDetectorRef, Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { noop, Subject } from "rxjs"
import { RenderApi } from "./interfaces"
import { unsubscribe } from "../connect/utils"

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi, OnDestroy {
    private readonly begin: Subject<void>
    private readonly end: Subject<void>

    constructor(rendererFactory: RendererFactory2) {
        const origBeginFn = rendererFactory.begin || noop
        const origEndFn = rendererFactory.end || noop
        const begin = new Subject<void>()
        const end = new Subject<void>()

        rendererFactory.begin = function() {
            begin.next()
            origBeginFn.apply(rendererFactory)
        }

        rendererFactory.end = function() {
            end.next()
            origEndFn.apply(rendererFactory)
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
