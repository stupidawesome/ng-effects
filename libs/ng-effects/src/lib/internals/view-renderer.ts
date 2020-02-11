import { ChangeDetectorRef, Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { noop } from "./utils"
import { share, take } from "rxjs/operators"
import { RenderApi } from "./interfaces"

@Injectable({ providedIn: "root" })
export class ViewRenderer implements RenderApi, OnDestroy {
    private readonly observer: Subject<null>

    constructor(rendererFactory: RendererFactory2) {
        const origEndFn = rendererFactory.end || noop
        const subject = new Subject<null>()
        const observers = subject.observers

        rendererFactory.end = () => {
            origEndFn.apply(rendererFactory)
            if (observers.length > 0) {
                subject.next(null)
            }
        }

        this.observer = subject
    }

    public detectChanges(componentOrView: any, changeDetector: ChangeDetectorRef) {
        changeDetector.detectChanges()
    }

    public markDirty(componentOrView: any, changeDetector: ChangeDetectorRef) {
        changeDetector.markForCheck()
    }

    public whenRendered(componentOrView: any) {
        return this.observer.pipe(take(1), share())
    }

    public ngOnDestroy() {
        this.observer.complete()
    }
}
