import { ChangeDetectorRef, Injectable, RendererFactory2 } from "@angular/core"
import { noop, Observable, Subject } from "rxjs"
import { RenderApi } from "./interfaces"
import { share } from "rxjs/operators"

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi {
    whenScheduled: Observable<any>
    whenRendered: Observable<any>

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

        this.whenScheduled = begin.pipe(
            share()
        )

        this.whenRendered = end.pipe(
            share()
        )
    }

    public detectChanges(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.detectChanges()
    }

    public markDirty(hostRef: any, changeDetector: ChangeDetectorRef) {
        changeDetector.markForCheck()
    }
}
