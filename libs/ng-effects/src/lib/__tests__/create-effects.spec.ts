import { Effect } from "../decorators"
import { Injectable } from "@angular/core"
import { effectsMap } from "../internals/constants"

describe("How to create effects", () => {
    it("should create an effects using the effect decorator", () => {
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
})
