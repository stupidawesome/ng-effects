import { InjectionToken } from "@angular/core"

export const EFFECTS = new InjectionToken("EFFECTS")
export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")

export interface HostRef<T = any> {
    instance: Readonly<T>
}
export abstract class HostRef<T = any> {}
