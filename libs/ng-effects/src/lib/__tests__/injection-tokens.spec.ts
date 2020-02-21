import { createSimpleComponent } from "./test-utils"
import { ElementRef, Injectable, Provider, Renderer2 } from "@angular/core"
import { effects } from "../providers"
import { HostRef } from "../constants"
import { Effect } from "../decorators"

@Injectable()
class EffectsWithSpecialTokens {
    // noinspection JSUnusedLocalSymbols
    constructor(elementRef: ElementRef, renderer: Renderer2) {}
    @Effect()
    anyEffect() {}
}

describe("How to use injection tokens", () => {
    it("should inject special host tokens", () => {
        let providers: Provider[]

        given: providers = effects(EffectsWithSpecialTokens)

        then: expect(() => createSimpleComponent(providers)).not.toThrow()
    })

    it("should inject a host ref", () => {
        let fixture, hostRef, providers: Provider[]

        given: providers = effects(EffectsWithSpecialTokens)

        when: fixture = createSimpleComponent(providers)

        then: hostRef = fixture.debugElement.injector.get(HostRef)
        then: expect(hostRef.context).toBe(fixture.debugElement.componentInstance)
    })
})
