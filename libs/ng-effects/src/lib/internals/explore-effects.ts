import { EffectMetadata, EffectOptions } from "../interfaces"
import { Type } from "@angular/core"
import { effectsMap } from "./constants"

const effectMetadata = new WeakMap<Type<any>, Generator<EffectMetadata>>()

export function* exploreEffects(
    defaults: EffectOptions,
    effects: Type<any>[],
): Generator<EffectMetadata> {
    for (const type of effects) {
        let metadata = effectMetadata.get(type)
        if (metadata) {
            yield* metadata
            continue
        }
        metadata = exploreEffect(defaults, type)
        effectMetadata.set(type, yield* metadata)
        yield* metadata
    }
}

export function* exploreEffect(
    defaults: EffectOptions,
    type: Type<any>,
): Generator<EffectMetadata> {
    const props = Object.getOwnPropertyNames(type.prototype)
    for (const name of props) {
        const method = type.prototype[name]
        const path = `${type.name} -> ${name}`
        const maybeOptions = effectsMap.get(method)

        if (maybeOptions) {
            const options: EffectOptions<any> = Object.assign({}, defaults, maybeOptions)

            const metadata = {
                path,
                type,
                name,
                options,
            }

            yield metadata
        }
    }
}
