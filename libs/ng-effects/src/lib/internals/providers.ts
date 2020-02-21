import {
    InjectionToken,
    isDevMode,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
} from "@angular/core"
import { mapState, proxyState } from "./utils"

export const DETECT_CHANGES = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => detectChanges,
})
export const MARK_DIRTY = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => markDirty,
})
export const STATE_FACTORY = new InjectionToken("STATE_FACTORY", {
    providedIn: "root",
    factory: () => (isDevMode() ? proxyState : mapState),
})
