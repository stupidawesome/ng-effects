import { runEffects } from "./internals/run-effects"
import { ChangeDetectorRef, ElementRef, INJECTOR, Optional, SkipSelf, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./internals/view-renderer"
import { connectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { createEffectsFactory } from "./internals/utils"
import { DefaultEffectOptions } from "./interfaces"
import { STATE_FACTORY } from "./internals/providers"
import { EFFECTS, HOST_INITIALIZER } from "./internals/constants"
import { Connect } from "./connect"
import { HostRef } from "./host-ref"
import { createHostRef } from "./internals/host-ref"

export const CONNECT = [
    {
        provide: Connect,
        useFactory: connectFactory,
        deps: [HOST_INITIALIZER, INJECTOR, HostRef],
    },
]

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
            ElementRef,
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

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: createEffectsFactory(types, effectOptions),
            deps: [HostRef],
        },
        CONNECT,
        CONNECT_EFFECTS,
        RUN_EFFECTS,
        HOST_REF,
        DestroyObserver,
        types,
    ]
}

export const HOST_EFFECTS = effects()

export const USE_EXPERIMENTAL_RENDER_API = [
    {
        provide: ViewRenderer,
        useClass: ExperimentalIvyViewRenderer,
    },
]
