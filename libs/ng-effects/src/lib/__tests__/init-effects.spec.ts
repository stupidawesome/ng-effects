import { TestBed } from "@angular/core/testing"
import { Effects, effects } from "../providers"
import {
    createDirective,
    createEffectsClass,
    createSimpleComponent,
    createSimpleDirective,
} from "./test-utils"
import { globalDefaults } from "../internals/constants"
import { EMPTY } from "rxjs"
import { Connect } from "../connect"
import { Effect } from "../decorators"
import { Directive } from "@angular/core"
import { effectMetadata } from "../internals/explore-effects"

describe("How to init effects", () => {
    it("should instantiate one effect on directives", () => {
        let effectsClass, effect

        given: effectsClass = createEffectsClass()

        when: createSimpleDirective([Effects, effectsClass])

        then: effect = TestBed.inject(effectsClass)
        then: expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init one effect on components", () => {
        let effectsClass, component, effect

        given: effectsClass = createEffectsClass()

        when: component = createSimpleComponent([Effects, effectsClass])

        then: effect = component.debugElement.injector.get(effectsClass)
        then: expect(effect.spy).toHaveBeenCalledTimes(1)
    })

    it("should init many effects", () => {
        let effectsClassList, effectsClass, effect

        given: effectsClassList = [createEffectsClass(), createEffectsClass()]

        when: createSimpleDirective([Effects, effectsClassList])

        then: for (effectsClass of effectsClassList) {
            effect = TestBed.inject(effectsClass)
            expect(effect.spy).toHaveBeenCalledTimes(1)
        }
    })

    it("should configure default options", () => {
        let effectsClass, options

        given: effectsClass = createEffectsClass()

        when: createSimpleDirective([Effects, effectsClass])

        then: [{ options }] = effectMetadata.get(effectsClass) as any
        then: expect(options).toEqual(globalDefaults)
    })

    it("should configure effect options", () => {
        let options, expected, effectsClass

        given: expected = {
            markDirty: undefined,
            detectChanges: undefined,
            whenRendered: undefined,
        }
        given: effectsClass = createEffectsClass(expected)

        when: createSimpleDirective([Effects, effectsClass, effects(expected)])

        then: [{ options }] = effectMetadata.get(effectsClass) as any
        then: expect(options).toEqual(expected)
    })

    it("should override default effect options", () => {
        let effectOptions, options, effectsClass, expected

        given: effectOptions = { markDirty: !globalDefaults.markDirty }
        given: expected = Object.assign({}, globalDefaults, effectOptions)
        given: effectsClass = createEffectsClass()
        when: createSimpleDirective([Effects, effectsClass, effects(effectOptions)])

        then: [{ options }] = effectMetadata.get(effectsClass) as any
        then: expect(options).toEqual(expected)
    })

    it("should apply options, in ascending order of precedence: global defaults < local defaults < effect options", () => {
        let effectOptions, localDefaults, expected, effectsClass: any, options

        given: effectOptions = { assign: true, whenRendered: false }
        given: localDefaults = { markDirty: !globalDefaults.markDirty, whenRendered: true }
        given: expected = Object.assign({}, globalDefaults, localDefaults, effectOptions)
        given: effectsClass = createEffectsClass(effectOptions)

        when: createSimpleDirective([Effects, effectsClass, effects(localDefaults)])

        then: [{ options }] = effectMetadata.get(effectsClass) as any
        then: expect(options).toEqual(expected)
    })

    it("should init with host effects", function() {
        let fixture

        when: fixture = createSimpleComponent([Effects, effects()])

        then: expect(fixture.componentInstance.spy).toHaveBeenCalled()
    })

    it("should accept effects that return observables, teardown logic, or void", () => {
        let AppDirective: any

        given: {
            @Directive()
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

        then: expect(() => createDirective(AppDirective, [Connect], [Effects])).not.toThrow()
    })

    it("should throw an error when an effect returns an unexpected value", () => {
        let AppDirective: any

        given: {
            @Directive()
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

        then: expect(() => createDirective(AppDirective, [Connect], [Effects])).toThrowError(
            "[ng-effects] Effects must either return an observable, subscription, or void",
        )
    })
})
