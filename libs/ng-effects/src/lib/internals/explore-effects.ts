import { DefaultEffectOptions, EffectMetadata, EffectOptions } from "../interfaces"
import { Type } from "@angular/core"
import { Context, Effect, Observe, State } from "../decorators"
import { getMetadata } from "./metadata"

export const effectMetadata = new Map<Type<any>, Set<EffectMetadata>>()

export function exploreEffects(defaults: DefaultEffectOptions): Generator<EffectMetadata> {
    const metadata = getMetadata(Effect)
    for (const [type, effects] of metadata) {
        if (effectMetadata.has(type)) {
            continue
        }

        const effect = new Set<EffectMetadata>()

        effectMetadata.set(type, effect)

        for (const [name, locals] of effects) {
            const path = `${type.name} -> ${name}`
            const adapter = locals && locals.adapter
            const options = mergeOptions(defaults, locals)
            const args = [State, Context, Observe].map(key => getMetadata(key, type, name))
            const metadata = {
                path,
                type,
                name,
                options,
                adapter,
                args,
            }

            effect.add(metadata)
        }
    }
    return metadata
}

export function mergeOptions(defaults: DefaultEffectOptions, options: EffectOptions<any> = {}) {
    if (options.adapter) {
        const adapterOptions = options.adapterOptions
        return adapterOptions && adapterOptions.length === 1
            ? adapterOptions[0]
            : adapterOptions
    }
    // default to `markDirty: true` for bound effects unless explicitly set
    const merged = Object.assign({}, defaults, options)
    if (merged.markDirty === undefined && Boolean(options.bind || options.assign)) {
        merged.markDirty = true
    }
    return merged
}
