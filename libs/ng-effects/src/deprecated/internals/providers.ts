import {
    ChangeDetectorRef,
    InjectionToken,
    INJECTOR,
    Optional,
    SkipSelf,
    ViewContainerRef,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
} from "@angular/core"
import { runEffects } from "./run-effects"
import { HostRef } from "../host-ref"
import { DestroyObserver } from "./destroy-observer"
import { ViewRenderer } from "../view-renderer"
import { createHostRef } from "./host-ref"
import { HOST_INITIALIZER } from "../constants"
import { EffectMetadata } from "../interfaces"
import { createEffectsFactory } from "./utils"

export const DETECT_CHANGES = new InjectionToken("DETECT_CHANGES", {
    providedIn: "root",
    factory: () => detectChanges,
})

export const MARK_DIRTY = new InjectionToken("MARK_DIRTY", {
    providedIn: "root",
    factory: () => markDirty,
})

export const HOST_REF = {
    provide: HostRef,
    useFactory: createHostRef,
    deps: [],
}

export const EFFECTS = new InjectionToken<EffectMetadata[]>("EFFECTS", {
    providedIn: "any",
    factory: createEffectsFactory(),
})

export const RUN_EFFECTS = [
    {
        provide: runEffects,
        useFactory: runEffects,
        deps: [
            EFFECTS,
            HostRef,
            DestroyObserver,
            ViewRenderer,
            [new SkipSelf(), new Optional(), HostRef],
            INJECTOR,
            [new Optional(), ChangeDetectorRef],
            [new Optional(), ViewContainerRef],
        ],
    },
]
export const CONNECT_EFFECTS = {
    provide: HOST_INITIALIZER,
    useValue: runEffects,
    multi: true,
}
