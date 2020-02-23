import { State } from "../interfaces"
import { BehaviorSubject } from "rxjs"

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
    readonly state: State<T>
    /**
     * An observer that emits whenever change detection occurs.
     */
    readonly observer: BehaviorSubject<T>

    readonly update: () => void

    constructor(state: State<T>, observer: BehaviorSubject<T>, update: () => void) {
        this.observer = observer
        this.state = state
        this.update = update
    }

    public setContext(value: any) {
        Object.defineProperty(this, "context", {
            get() {
                return value
            },
        })
        this.update()
    }

    public tick() {
        this.observer.next(this.context)
    }
}

export function createHostRef(mapState: Function) {
    const observer = new BehaviorSubject({})
    const state = mapState(observer)
    return new HostRef(state, observer, function update(this: HostRef) {
        mapState(this.observer, this.state, this.context)
        this.tick()
    })
}
