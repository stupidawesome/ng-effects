import { EffectFn } from "../interfaces"

export const effectsMap = new WeakMap<EffectFn<any>>()
export const currentContext = new Set()
