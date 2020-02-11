import { Injectable, OnDestroy } from "@angular/core"
import { Subject } from "rxjs"

@Injectable()
export class DestroyObserver implements OnDestroy {
    public destroyed = new Subject<void>()

    public ngOnDestroy() {
        this.destroyed.next()
        this.destroyed.complete()
        this.destroyed.unsubscribe()
    }
}
