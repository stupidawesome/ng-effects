import { TestBed } from "@angular/core/testing"
import { effects, HOST_EFFECTS } from "../providers"
import {
    createDirective,
    createEffectsClass,
    createSimpleComponent,
    createSimpleDirective,
} from "./test-utils"
import { globalDefaults, EFFECTS } from "../internals/constants"
import { EMPTY } from "rxjs"
import { OnDestroy } from "@angular/core"
import { Connect } from "../connect"
import { runEffects } from "../internals/run-effects"
import { EffectMetadata } from "../interfaces"
import { Effect } from "../decorators"
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
                provide: runEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(globalDefaults)
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
                provide: runEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(options)
    })

    it("should override default effect options", () => {
        let options, effectsClass, spy: Mock, result, MockInitEffects

        given: options = { markDirty: !globalDefaults.markDirty }
        given: result = Object.assign({}, globalDefaults, options)
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
                provide: runEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(result)
    })

    it("should apply options, in ascending order of precedence: global defaults < local defaults < effect options", () => {
        let effectOptions, localDefaults, result, effectsClass, spy: Mock, MockInitEffects

        given: effectOptions = { assign: true, whenRendered: false }
        given: localDefaults = { markDirty: !globalDefaults.markDirty, whenRendered: true }
        given: result = Object.assign({}, globalDefaults, localDefaults, effectOptions)
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
                provide: runEffects,
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
                provide: runEffects,
                useClass: MockInitEffects,
                deps: [EFFECTS],
            },
        ])

        then: expect(spy).toHaveBeenCalledWith(1)
    })

    it("should accept effects that return observables, teardown logic, or void", () => {
        let AppDirective: any

        given: {
            class MockAppDirective {
                @Effect()
                observableEffect() {
                    return EMPTY
                }
                @Effect()
                subscriptionEffect() {
                    return EMPTY.subscribe()
                }
                @Effect()
                teardownEffect() {
                    return () => {}
                }
                @Effect()
                voidEffect() {
                    return
                }

                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppDirective = MockAppDirective
        }

        then: expect(() => createDirective(AppDirective, [Connect], HOST_EFFECTS)).not.toThrow()
    })

    it("should throw an error when an effect returns an unexpected value", () => {
        let AppDirective: any

        given: {
            class MockAppDirective {
                @Effect()
                badReturnType() {
                    return "BAD RETURN TYPE" as any
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppDirective = MockAppDirective
        }

        then: expect(() => createDirective(AppDirective, [Connect], HOST_EFFECTS)).toThrowError(
            "[ng-effects] Effects must either return an observable, subscription, or void",
        )
    })
})
