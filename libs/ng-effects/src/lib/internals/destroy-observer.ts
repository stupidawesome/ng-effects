import { Injectable, OnDestroy } from "@angular/core"
import { Subject, TeardownLogic } from "rxjs"
import { unsubscribe } from "./utils"

@Injectable()
export class DestroyObserver implements OnDestroy {
    public isDestroyed = false
    public destroyed = new Subject<void>()
    public subs: any[] = [this.destroyed]

    public add(...sub: (TeardownLogic | Subject<any>)[]) {
        this.subs = this.subs.concat(sub)
    }

    public ngOnDestroy() {
        this.isDestroyed = true
        unsubscribe(this.subs)
    }
}
