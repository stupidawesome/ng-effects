import {
    ChangeDetectorRef,
    InjectionToken,
    INJECTOR,
    isDevMode,
    Optional,
    SkipSelf,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
} from "@angular/core"
import { mapState, proxyState } from "./utils"
import { runEffects } from "./run-effects"
import { EFFECTS } from "./constants"
import { HostRef } from "../host-ref"
import { DestroyObserver } from "./destroy-observer"
import { ViewRenderer } from "../view-renderer"
import { createHostRef } from "./host-ref"
import { HOST_INITIALIZER } from "../constants"

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
export const HOST_REF = {
    provide: HostRef,
    useFactory: createHostRef,
    deps: [STATE_FACTORY],
}
export const RUN_EFFECTS = [
    {
        provide: runEffects,
        useFactory: runEffects,
        deps: [
            EFFECTS,
            HostRef,
            ChangeDetectorRef,
            DestroyObserver,
            ViewRenderer,
            INJECTOR,
            [HostRef, new SkipSelf(), new Optional()],
        ],
    },
]
export const CONNECT_EFFECTS = {
    provide: HOST_INITIALIZER,
    useValue: runEffects,
    multi: true,
}
