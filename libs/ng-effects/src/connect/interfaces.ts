import { State } from "../lib/decorators"
import { Observable } from "rxjs"

export abstract class HostRef<T extends any = any> {
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

export interface OnConnect<T extends object = any> {
    ngOnConnect(context?: T): void
}
