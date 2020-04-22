import { Observable } from "rxjs"
import { State } from "./decorators"

export abstract class HostRef<T = any> {
    /**
     * The component or directive instance.
     */
    abstract readonly context: T
    /**
     * The observable state of the component or directive instance.
     */
    abstract readonly state: State<T>
    // noinspection JSUnusedGlobalSymbols
    /**
     * An observer that emits whenever change detection occurs.
     */
    abstract readonly observer: Observable<T>
}
