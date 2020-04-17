import { createSimpleComponent } from "./test-utils"
import { ElementRef, Injectable, Provider, Renderer2 } from "@angular/core"
import { Effects } from "../providers"
import { Effect } from "../decorators"
import { HostRef } from "../../connect/interfaces"

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

        given: providers = [Effects]

        then: expect(() => createSimpleComponent(providers)).not.toThrow()
    })

    it("should inject a host ref", () => {
        let fixture, hostRef, providers: Provider[]

        given: providers = [Effects]

        when: fixture = createSimpleComponent(providers)

        then: hostRef = fixture.debugElement.injector.get(HostRef)
        then: expect(hostRef.context).toBe(fixture.debugElement.componentInstance)
    })
})
