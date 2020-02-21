import { Injectable, OnDestroy } from "@angular/core"
import { Subject, TeardownLogic } from "rxjs"

@Injectable()
export class DestroyObserver implements OnDestroy {
    public destroyed = new Subject<void>()
    public subs: any[] = [this.destroyed]

    public add(...sub: (TeardownLogic | Subject<any>)[]) {
        this.subs.concat(sub)
    }

    public ngOnDestroy() {
        for (const sub of this.subs) {
            sub.complete && sub.complete()
            sub.unsubscribe && sub.unsubscribe()
            sub.call && sub()
        }
    }
}
