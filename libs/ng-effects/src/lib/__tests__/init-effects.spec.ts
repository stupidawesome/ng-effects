import { TestBed } from "@angular/core/testing"
import { Connect, effects, HOST_EFFECTS } from "../providers"
import {
    createDirective,
    createEffectsClass,
    createSimpleComponent,
    createSimpleDirective,
} from "./test-utils"
import { defaultOptions } from "../internals/constants"
import { InitEffects } from "../internals/init-effects"
import { EffectMetadata } from "../interfaces"
import { EFFECTS } from "../constants"
import { EMPTY } from "rxjs"
import { createEffect } from "../utils"
import { OnDestroy } from "@angular/core"
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
            assign: undefined,
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

        given: effectOptions = { assign: true, whenRendered: false }
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
        given: MockInitEffects = class implements OnDestroy {
            constructor(effectMetadata: EffectMetadata[]) {
                spy(effectMetadata.length)
            }
            ngOnDestroy() {}
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

    it("should accept effects that return observables, teardown logic, or void", () => {
        let AppDirective: any

        given: AppDirective = class {
            // noinspection JSUnusedGlobalSymbols
            observableEffect = createEffect(() => {
                return EMPTY
            })
            // noinspection JSUnusedGlobalSymbols
            subscriptionEffect = createEffect(() => {
                return EMPTY.subscribe()
            })
            // noinspection JSUnusedGlobalSymbols
            teardownEffect = createEffect(() => {
                return () => {}
            })
            // noinspection JSUnusedGlobalSymbols
            voidEffect = createEffect(() => {
                return
            })
            constructor(connect: Connect) {
                connect(this)
            }
        }

        then: expect(() => createDirective(AppDirective, [Connect], HOST_EFFECTS)).not.toThrow()
    })

    it("should throw an error when an effect returns an unexpected value", () => {
        let AppDirective: any

        given: AppDirective = class {
            // noinspection JSUnusedGlobalSymbols
            badReturnType = createEffect(() => {
                return "BAD RETURN TYPE" as any
            })
            constructor(connect: Connect) {
                connect(this)
            }
        }

        then: expect(() => createDirective(AppDirective, [Connect], HOST_EFFECTS)).toThrowError(
            "[ng-effects] Effects must either return an observable, subscription, or void",
        )
    })
})
