import { InjectionToken, isDevMode } from "@angular/core"

export const EFFECTS = new InjectionToken("EFFECTS")
export const DEV_MODE = new InjectionToken("DEV_MODE", {
    providedIn: "root",
    factory: () => isDevMode(),
})
export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")
export const HOST_CONTEXT = new InjectionToken("HOST_CONTEXT")
