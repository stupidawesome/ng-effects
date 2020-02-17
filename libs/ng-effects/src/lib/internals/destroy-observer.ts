import { Injectable, OnDestroy } from "@angular/core"
import { ReplaySubject, Subject, TeardownLogic } from "rxjs"

@Injectable()
export class DestroyObserver implements OnDestroy {
    public subs: any[] = []
    public destroyed = new ReplaySubject<void>()

    public add(...sub: (TeardownLogic | Subject<any>)[]) {
        this.subs.concat(sub)
    }

    public ngOnDestroy() {
        for (const sub of this.subs) {
            if (sub.complete) {
                sub.complete()
            }
            if (sub.unsubscribe) {
                sub.unsubscribe()
            }
            if (typeof sub === "function") {
                sub()
            }
        }
        this.destroyed.next()
        this.destroyed.complete()
        this.destroyed.unsubscribe()
    }
}
