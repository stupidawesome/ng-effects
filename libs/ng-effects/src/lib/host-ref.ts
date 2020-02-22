import { BehaviorSubject } from "rxjs"
import { State } from "./interfaces"

export abstract class HostRef<T = any> {
    /**
     * The component or directive instance.
     */
    abstract readonly context: T
    /**
     * The observable state of the component or directive instance.
     */
    abstract readonly state: State<T>
    /**
     * An observer that emits whenever change detection occurs.
     */
    abstract readonly observer: BehaviorSubject<T>
}
