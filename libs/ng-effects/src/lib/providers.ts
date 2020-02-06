import { injectAll } from "./internals/utils"
import { Effects } from "./effects"
import { EFFECTS } from "./constants"

export function withEffects(...effects: any[]) {
    return [
        {
            provide: EFFECTS,
            deps: effects,
            useFactory: injectAll,
        },
        Effects,
        effects,
    ]
}
