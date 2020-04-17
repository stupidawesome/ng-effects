import { DefaultEffectOptions } from "../interfaces"
import { globalDefaults } from "./constants"
import { exploreEffects } from "./explore-effects"
import { TeardownLogic } from "rxjs"

export function createEffectsFactory(options?: DefaultEffectOptions) {
    return function() {
        const defaults = Object.assign({}, globalDefaults, options)
        return [...exploreEffects(defaults)]
    }
}

export function isTeardownLogic(value: any): value is TeardownLogic {
    return (
        typeof value === "function" ||
        (typeof value === "object" && typeof value.unsubscribe === "function")
    )
}
