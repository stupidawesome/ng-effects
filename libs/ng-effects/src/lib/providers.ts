import { createEffectsFactory } from "./internals/utils"
import { DefaultEffectOptions } from "./interfaces"
import { CONNECT_EFFECTS, EFFECTS, RUN_EFFECTS } from "./internals/providers"
import { DestroyObserver } from "../connect/destroy-observer"
import { CONNECT, CONNECT_SCHEDULER, RUN_SCHEDULER } from "../connect/providers"

export function effects(effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: createEffectsFactory(effectOptions),
        },
    ]
}

export const Effects = [
    CONNECT,
    CONNECT_SCHEDULER,
    RUN_SCHEDULER,
    CONNECT_EFFECTS,
    RUN_EFFECTS,
    DestroyObserver,
]
