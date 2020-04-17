import {
    InjectionToken,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
} from "@angular/core"

export const DETECT_CHANGES = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => detectChanges,
})

export const MARK_DIRTY = new InjectionToken("MARK_DIRTY", {
    providedIn: "root",
    factory: () => markDirty,
})
