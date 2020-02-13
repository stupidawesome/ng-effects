import { InjectionToken, isDevMode } from "@angular/core"

export const EFFECTS = new InjectionToken("EFFECTS")
export const DEV_MODE = new InjectionToken("DEV_MODE", {
    providedIn: "root",
    factory: () => isDevMode(),
})
export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")
export const STRICT_MODE = new InjectionToken("STRICT_MODE", { factory: () => false })

export interface HostRef<T = any> {
    instance: T
}
export abstract class HostRef<T = any> {}
