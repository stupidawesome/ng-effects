import { TestBed } from "@angular/core/testing"
import { effects, HOST_EFFECTS } from "../providers"
import { createEffectsClass, createSimpleComponent, createSimpleDirective } from "./test-utils"
import { defaultOptions } from "../internals/constants"
import { InitEffects } from "../internals/init-effects"
import { EffectMetadata } from "../interfaces"
import { EFFECTS } from "../constants"
import fn = jest.fn
import Mock = jest.Mock

describe("How to init effects", () => {
    it("should instantiate one effect on directives", () => {
        let effectsClass, effect

        given: effectsClass = createEffectsClass()

        when: createSimpleDirective(effects(effectsClass))

        then: effect = TestBed.inject(effectsClass)
        then: expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init one effect on components", () => {
        let effectsClass, component, effect

        given: effectsClass = createEffectsClass()

        when: component = createSimpleComponent(effects(effectsClass))

        then: effect = component.debugElement.injector.get(effectsClass)
        then: expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init many effects", () => {
        let effectsClassList, effectsClass, effect

        given: effectsClassList = [createEffectsClass(), createEffectsClass()]

        when: createSimpleDirective(effects(effectsClassList))

        then: for (effectsClass of effectsClassList) {
            effect = TestBed.inject(effectsClass)
            expect(effect.spy).toHaveBeenCalledTimes(1)
        }
    })

    it("should configure default options", () => {
        let effectsClass, spy: Mock, MockInitEffects

        given: effectsClass = createEffectsClass()
        given: spy = fn()
        given: MockInitEffects = class {
            constructor(effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        when: createSimpleDirective([
            effects(effectsClass),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(defaultOptions)
    })

    it("should configure effect options", () => {
        let options, effectsClass, spy: Mock, MockInitEffects

        given: options = {
            bind: undefined,
            markDirty: undefined,
            adapter: undefined,
            apply: undefined,
            detectChanges: undefined,
            whenRendered: undefined,
        }
        given: effectsClass = createEffectsClass(options)
        given: spy = fn()
        given: MockInitEffects = class {
            constructor(effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        when: createSimpleDirective([
            effects(effectsClass),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(options)
    })

    it("should override default effect options", () => {
        let options, effectsClass, spy: Mock, result, MockInitEffects

        given: options = { markDirty: !defaultOptions.markDirty }
        given: result = Object.assign({}, defaultOptions, options)
        given: effectsClass = createEffectsClass()
        given: spy = fn()
        given: MockInitEffects = class {
            constructor(effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        when: createSimpleDirective([
            effects(effectsClass, options),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(result)
    })

    it("should apply options, in ascending order of precedence: global defaults < local defaults < effect options", () => {
        let effectOptions, localDefaults, result, effectsClass, spy: Mock, MockInitEffects

        given: effectOptions = { apply: true, whenRendered: false }
        given: localDefaults = { markDirty: !defaultOptions.markDirty, whenRendered: true }
        given: result = Object.assign({}, defaultOptions, localDefaults, effectOptions)
        given: effectsClass = createEffectsClass(effectOptions)
        given: spy = fn()
        given: MockInitEffects = class {
            constructor(effectMetadata: EffectMetadata[]) {
                effectMetadata.forEach(meta => spy(meta.options))
            }
        }

        when: createSimpleDirective([
            effects(effectsClass, localDefaults),
            {
                provide: InitEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(result)
    })

    it("should init with host effects", function() {
        let spy: Mock, MockInitEffects

        given: spy = fn()
        given: MockInitEffects = class {
            constructor(effectMetadata: EffectMetadata[]) {
                spy(effectMetadata.length)
            }
        }

        when: createSimpleComponent([
            HOST_EFFECTS,
            {
                provide: InitEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(1)
    })
})
