import { InjectionToken } from "@angular/core"
import { State } from "./interfaces"
import { Observable } from "rxjs"

export const EFFECTS = new InjectionToken("EFFECTS")
export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")

export interface HostRef<T = any> {
    readonly context: T
    readonly state: State<T>
    readonly observer: Observable<T>
}

export abstract class HostRef<T = any> {}
