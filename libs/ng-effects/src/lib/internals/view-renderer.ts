import {
    ChangeDetectorRef,
    Injectable,
    OnDestroy,
    RendererFactory2,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
    ɵwhenRendered as whenRendered,
} from "@angular/core"
import { defer, EMPTY, Observable, Subject } from "rxjs"
import { noop } from "./utils"
import { catchError, share, take } from "rxjs/operators"

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenRendered(componentOrView: any, changeDetector?: ChangeDetectorRef): Observable<null>
}

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

@Injectable()
export class ExperimentalIvyViewRenderer implements RenderApi {
    detectChanges(componentOrView: any): void {
        detectChanges(componentOrView)
    }

    markDirty(componentOrView: any): void {
        markDirty(componentOrView)
    }

    whenRendered(componentOrView: any): Observable<null> {
        return defer(() => whenRendered(componentOrView)).pipe(
            catchError(() => EMPTY),
            share(),
        )
    }
}
