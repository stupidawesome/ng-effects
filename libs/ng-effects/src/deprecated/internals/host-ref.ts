import { BehaviorSubject } from "rxjs"
import { proxyState } from "./utils"

function throwInitialisationError(): never {
    throw new Error(`[ng-effects] Cannot access HostRef context before it has been initialised.`)
}

/**
 * Represents a directive connected via `Connect`. Provides access to the directive and related objects.
 *
 * @publicApi
 */
export class HostRef<T = any> {
    /**
     * The component or directive instance.
     */
    get context(): T {
        return throwInitialisationError()
    }
    /**
     * The observable state of the component or directive instance.
     */
    get state() {
        return proxyState(this.observer, this.context)
    }
    /**
     * An observer that emits whenever change detection occurs.
     */
    readonly observer: BehaviorSubject<T>

    constructor(observer: BehaviorSubject<T>) {
        this.observer = observer
    }

    public setContext(value: any) {
        Object.defineProperty(this, "context", {
            get() {
                return value
            },
        })
        this.tick()
    }

    public tick() {
        this.observer.next(this.context)
    }
}

export function createHostRef() {
    return new HostRef(new BehaviorSubject({}))
}
