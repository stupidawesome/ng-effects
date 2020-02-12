import { TestBed } from "@angular/core/testing"
import { effects } from "../providers"
import { createEffectsClass, createSimpleComponent, createSimpleDirective } from "./utils"
import { defaultOptions } from "../internals/constants"
import { InitEffects } from "../internals/init-effects"
import { Inject, Injectable } from "@angular/core"
import { EffectMetadata } from "../interfaces"
import { EFFECTS } from "../constants"
import fn = jest.fn

describe("How to init effects", () => {
    it("should instantiate one effect on directives", () => {
        const effectsClass = createEffectsClass()

        createSimpleDirective(effects(effectsClass))

        const effect = TestBed.inject(effectsClass)

        expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init one effect on components", () => {
        const effectsClass = createEffectsClass()

        const component = createSimpleComponent(effects(effectsClass))

        const effect = component.debugElement.injector.get(effectsClass)

        expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init many effects", () => {
        const effectsClassList = [createEffectsClass(), createEffectsClass()]

        createSimpleDirective(effects(effectsClassList))

        for (const effectsClass of effectsClassList) {
            const effect = TestBed.inject(effectsClass)
            expect(effect.spy).toHaveBeenCalledTimes(1)
        }
    })

    it("should configure default options", () => {
        const effectsClass = createEffectsClass()
        const spy = fn()

        @Injectable()
        class MockInitEffects {
            constructor(@Inject(EFFECTS) effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        createSimpleDirective([
            effects(effectsClass),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
            },
        ])

        expect(spy).toHaveBeenCalledWith(defaultOptions)
    })

    it("should configure effect options", () => {
        const options = {
            bind: undefined,
            markDirty: undefined,
            adapter: undefined,
            apply: undefined,
            detectChanges: undefined,
            whenRendered: undefined,
        }
        const effectsClass = createEffectsClass(options)
        const spy = fn()

        @Injectable()
        class MockInitEffects {
            constructor(@Inject(EFFECTS) effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        createSimpleDirective([
            effects(effectsClass),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
            },
        ])

        expect(spy).toHaveBeenCalledWith(options)
    })

    it("should override default effect options", () => {
        const options = { markDirty: !defaultOptions.markDirty }
        const result = Object.assign({}, defaultOptions, options)
        const effectsClass = createEffectsClass()
        const spy = fn()

        @Injectable()
        class MockInitEffects {
            constructor(@Inject(EFFECTS) effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        createSimpleDirective([
            effects(effectsClass, options),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
            },
        ])

        expect(spy).toHaveBeenCalledWith(result)
    })
})
