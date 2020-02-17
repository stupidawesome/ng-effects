import { EffectHandler, EffectMetadata, EffectOptions } from "../interfaces"
import { Injector, Type } from "@angular/core"
import { effectsMap } from "./constants"

export function* exploreEffects(
    defaults: EffectOptions,
    hostContext: any,
    hostType: Type<any>,
    injector: Injector,
    effects: Type<any>[],
): Generator<EffectMetadata> {
    const metadata = yield* exploreEffect(defaults, injector, hostType, hostContext, hostContext)
    if (metadata) {
        yield metadata
    }
    for (const type of effects) {
        const effect = injector.get(type)
        const metadata = yield* exploreEffect(defaults, injector, type, effect, hostContext)

        if (metadata) {
            yield metadata
        }
    }
}

export function* exploreEffect(
    defaults: EffectOptions,
    injector: Injector,
    type: any,
    target: any,
    context: any,
): Generator<EffectMetadata> {
    const props = [
        ...Object.getOwnPropertyNames(type.prototype),
        ...Object.getOwnPropertyNames(target),
    ]
    for (const name of props) {
        const method = target[name]
        const maybeOptions = effectsMap.get(method)

        if (method && maybeOptions) {
            let adapter: EffectHandler<any, any> | undefined
            const options: EffectOptions<any> = Object.assign({}, defaults, maybeOptions)

            if (options.adapter) {
                adapter = injector.get(options.adapter)
            }

            const metadata = {
                name,
                type,
                target,
                method,
                options,
                adapter,
                context,
            }

            yield metadata
        }
    }
}
