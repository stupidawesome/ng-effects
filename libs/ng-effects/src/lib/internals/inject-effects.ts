import { DefaultEffectOptions, EffectMetadata } from "../interfaces"
import { HostRef } from "../constants"
import { Injector } from "@angular/core"
import { defaultOptions } from "./constants"
import { exploreEffects } from "./explore-effects"

export function injectEffectsFactory(effects: any | any[], options?: DefaultEffectOptions) {
    return function injectEffects(hostRef: HostRef, injector: Injector): EffectMetadata[] {
        const hostContext = hostRef.context
        const hostType = Object.getPrototypeOf(hostContext).constructor
        const defaults = Object.assign({}, defaultOptions, options)

        return [...exploreEffects(defaults, hostContext, hostType, injector, [].concat(effects))]
    }
}
