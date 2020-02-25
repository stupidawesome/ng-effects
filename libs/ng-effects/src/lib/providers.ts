import { INJECTOR, Type } from "@angular/core"
import { ViewRenderer } from "./view-renderer"
import { connectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { createEffectsFactory } from "./internals/utils"
import { DefaultEffectOptions } from "./interfaces"
import { EFFECTS } from "./internals/constants"
import { Connect } from "./connect"
import { HOST_INITIALIZER } from "./constants"
import { CONNECT_EFFECTS, HOST_REF, RUN_EFFECTS } from "./internals/providers"
import { DestroyObserver } from "./internals/destroy-observer"

export const CONNECT = [
    {
        provide: Connect,
        useFactory: connectFactory,
        deps: [HOST_INITIALIZER, INJECTOR],
    },
    HOST_REF,
]

export const Effects = [CONNECT, RUN_EFFECTS, DestroyObserver]

export function effects(types: Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: createEffectsFactory(types, effectOptions),
            deps: [],
        },
        CONNECT_EFFECTS,
    ]
}

export const USE_EXPERIMENTAL_RENDER_API = [
    {
        provide: ViewRenderer,
        useClass: ExperimentalIvyViewRenderer,
    },
]
