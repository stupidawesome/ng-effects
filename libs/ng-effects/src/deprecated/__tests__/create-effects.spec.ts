import { Injectable } from "@angular/core"
import { getMetadata } from "../internals/metadata"
import { Effect } from "../effect"

describe("How to create effects", () => {
    it("should create an effects using the effect decorator", () => {
        let defineEffects,
            effects,
            expectedEffects,
            expectedOptions: any,
            options: any

        given: expectedOptions = {}

        given: defineEffects = () => {
            @Injectable()
            class TestEffects {
                @Effect(expectedOptions)
                decoratedEffect() {}
            }
            return TestEffects
        }

        when: expectedEffects = defineEffects()

        then: [[effects, [[, options]]]] = getMetadata(Effect)

        then: expect(effects).toBe(expectedEffects)
        then: expect(options).toBe(expectedOptions)
    })
})
