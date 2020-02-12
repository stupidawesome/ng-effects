import { createEffect } from "../utils"
import { Effect } from "../decorators"
import { Injectable } from "@angular/core"
import { effectsMap } from "../internals/constants"

describe("How to create effects", () => {
    it("can create an effects using the effect decorator", () => {
        @Injectable()
        class TestEffects {
            @Effect()
            decoratedEffect() {}
        }

        expect(effectsMap.has(TestEffects.prototype.decoratedEffect)).toBe(true)
    })

    it("can create effects using the effect factory", () => {
        @Injectable()
        class TestEffects {
            effectFactory = createEffect(() => {})
        }

        const effects = new TestEffects()

        expect(effectsMap.has(effects.effectFactory)).toBe(true)
    })
})
