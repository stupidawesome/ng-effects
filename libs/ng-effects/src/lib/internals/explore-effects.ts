import { DefaultEffectOptions, EffectMetadata, EffectOptions } from "../interfaces"
import { Type } from "@angular/core"
import { effectsMap } from "./constants"
import { Context, Observe, State } from "../decorators"
import { getMetadata } from "./metadata"

const effectMetadata = new WeakMap<Type<any>, Generator<EffectMetadata>>()

export function* exploreEffects(
    defaults: DefaultEffectOptions,
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

export function mergeOptions(defaults: DefaultEffectOptions, options: EffectOptions<any>) {
    // default to `markDirty: true` for bound effects unless explicitly set
    const merged = Object.assign({}, defaults, options)
    if (merged.markDirty === undefined && Boolean(options.bind || options.assign)) {
        merged.markDirty = true
    }
    return merged
}

export function* exploreEffect(
    defaults: EffectOptions,
    type: Type<any>,
): Generator<EffectMetadata> {
    const props = Object.getOwnPropertyNames(type.prototype)
    for (const name of props) {
        const method = type.prototype[name]
        const maybeOptions = effectsMap.get(method)

        if (maybeOptions) {
            const path = `${type.name} -> ${name}`
            const options: EffectOptions<any> = mergeOptions(defaults, maybeOptions)
            const args = [State, Context, Observe].map((key) =>
                getMetadata(key, type.prototype, name),
            )
            const metadata = {
                path,
                type,
                name,
                options,
                args,
            }

            yield metadata
        }
    }
}
