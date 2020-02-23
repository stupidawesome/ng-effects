import { INJECTOR, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./view-renderer"
import { connectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { createEffectsFactory } from "./internals/utils"
import { DefaultEffectOptions } from "./interfaces"
import { CONNECT_EFFECTS, HOST_REF, RUN_EFFECTS } from "./internals/providers"
import { EFFECTS } from "./internals/constants"
import { Connect } from "./connect"
import { HostRef } from "./host-ref"
import { HOST_INITIALIZER } from "./constants"

export const CONNECT = [
    {
        provide: Connect,
        useFactory: connectFactory,
        deps: [HOST_INITIALIZER, INJECTOR, HostRef],
    },
]

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
