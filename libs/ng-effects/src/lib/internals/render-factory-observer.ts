import { Injectable, OnDestroy, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { noop } from "./utils"

@Injectable({ providedIn: "root" })
export class RenderFactoryObserver implements OnDestroy {
    private readonly observer: Subject<void>

    constructor(rendererFactory: RendererFactory2) {
        const origEndFn = rendererFactory.end || noop
        const subject = new Subject<void>()
        const observers = subject.observers

        rendererFactory.end = () => {
            origEndFn.apply(rendererFactory)
            if (observers.length > 0) {
                subject.next()
            }
        }

        this.observer = subject
    }

    public whenRendered() {
        return this.observer.asObservable()
    }

    public ngOnDestroy() {
        this.observer.complete()
    }
}
