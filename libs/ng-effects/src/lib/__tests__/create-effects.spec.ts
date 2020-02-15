import { createEffect } from "../utils"
import { Effect } from "../decorators"
import { Injectable } from "@angular/core"
import { effectsMap } from "../internals/constants"

describe("How to create effects", () => {
    it("can create an effects using the effect decorator", () => {
        let defineEffects, effects

        given: defineEffects = () => {
            @Injectable()
            class TestEffects {
                @Effect()
                decoratedEffect() {}
            }
            return TestEffects
        }

        when: effects = defineEffects()

        then: expect(effectsMap.has(effects.prototype.decoratedEffect)).toBe(true)
    })

    it("can create effects using the effect factory", () => {
        let createEffects, effects

        given: createEffects = () => {
            @Injectable()
            class TestEffects {
                effect = createEffect(() => {})
            }
            return new TestEffects()
        }

        when: effects = createEffects()

        then: expect(effectsMap.has(effects.effect)).toBe(true)
    })
})
