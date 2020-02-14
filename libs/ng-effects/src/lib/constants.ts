import { InjectionToken } from "@angular/core"

export const EFFECTS = new InjectionToken("EFFECTS")
export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")
export const STRICT_MODE = new InjectionToken("STRICT_MODE", { factory: () => false })

export interface HostRef<T = any> {
    instance: Readonly<T>
}
export abstract class HostRef<T = any> {}
