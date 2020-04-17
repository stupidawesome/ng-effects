import { InjectionToken, INJECTOR, Optional, ViewContainerRef } from "@angular/core"
import { DestroyObserver } from "../../connect/destroy-observer"
import { ViewRenderer } from "../../scheduler/view-renderer"
import { EffectMetadata } from "../interfaces"
import { createEffectsFactory } from "./utils"
import { runEffects } from "./run-effects"
import { ChangeNotifier, HOST_INITIALIZER } from "../../connect/providers"
import { HostRef } from "../../connect/interfaces"

export const EFFECTS = new InjectionToken<EffectMetadata[]>("EFFECTS", {
    providedIn: "any",
    factory: createEffectsFactory(),
})

export const CONNECT_EFFECTS = [
    {
        provide: HOST_INITIALIZER,
        useValue: runEffects,
        multi: true,
    },
]

export const RUN_EFFECTS = [
    {
        provide: runEffects,
        useFactory: runEffects,
        deps: [
            HostRef,
            DestroyObserver,
            ViewRenderer,
            INJECTOR,
            ChangeNotifier,
            [new Optional(), ViewContainerRef],
            EFFECTS,
        ],
    },
]
