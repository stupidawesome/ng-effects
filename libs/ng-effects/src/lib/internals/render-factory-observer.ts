import { Injectable, OnDestroy, Renderer2, RendererFactory2 } from "@angular/core"
import { Subject } from "rxjs"
import { filter, take } from "rxjs/operators"
import { noop } from "./utils"

@Injectable({ providedIn: "root" })
export class RenderFactoryObserver implements OnDestroy {
    private readonly observer: Subject<void>

    constructor(rendererFactory: RendererFactory2) {
        const origEndFn = rendererFactory.end || noop
        const subject = new Subject<void>()

        rendererFactory.end = () => {
            origEndFn.apply(rendererFactory)
            subject.next()
        }

        this.observer = subject
    }

    public whenRendered(element: any, renderer: Renderer2) {
        return this.observer.pipe(
            filter(() => renderer.parentNode(element) !== null),
            take(1),
        )
    }

    public ngOnDestroy() {
        this.observer.complete()
    }
}
