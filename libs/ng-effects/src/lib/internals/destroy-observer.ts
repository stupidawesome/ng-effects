import { Injectable, OnDestroy } from "@angular/core"
import { AsyncSubject } from "rxjs"

@Injectable()
export class DestroyObserver implements OnDestroy {
    public destroyed = new AsyncSubject<void>()

    public ngOnDestroy() {
        this.destroyed.next()
        this.destroyed.complete()
    }
}
