import { createFxComponent } from "./utils"
import { fx, inject } from "../ngfx"
import { TestBed } from "@angular/core/testing"
import { ElementRef, InjectFlags, Type } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import fn = jest.fn
import Mock = jest.Mock
import any = jasmine.any

describe("inject", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule],
            providers: [],
        })
    })

    it("should use the NodeInjector when used in directives", () => {
        let spy: Mock, subject, expected: Type<ElementRef>

        expected = ElementRef
        spy = fn()
        subject = createFxComponent(
            fx(() => {
                spy(inject(expected))
            }),
        )

        TestBed.createComponent(subject)

        expect(spy).toHaveBeenCalledWith(any(expected))
    })

    it("should use the R3Injector when used in module provided services", () => {
        let spy: Mock, subject, expected, provider: Type<any>

        provider = fx(() => {
            spy(inject(ElementRef, InjectFlags.Optional))
        })

        expected = null
        spy = fn()
        subject = createFxComponent(
            fx(() => {
                inject(provider)
            }),
        )

        TestBed.configureTestingModule({
            providers: [provider],
        })

        TestBed.createComponent(subject)

        expect(spy).toHaveBeenCalledWith(expected)
    })

    it("should use the NodeInjector when used in component provided services", () => {
        let spy: Mock, subject, expected, provider: Type<any>

        provider = fx(() => {
            spy(inject(ElementRef, InjectFlags.Optional))
        })

        expected = any(ElementRef)
        spy = fn()
        subject = createFxComponent(
            fx(() => {
                inject(provider)
            }),
        )

        TestBed.overrideComponent(subject, {
            add: {
                providers: [provider],
            },
        })

        TestBed.createComponent(subject)

        expect(spy).toHaveBeenCalledWith(expected)
    })

    it("should switch to the R3Injector when injecting a module-provided token from a component-provided service", () => {
        let spy: Mock,
            subject,
            expected,
            provider: Type<any>,
            provider2: Type<any>

        provider2 = fx(() => {
            spy(inject(ElementRef, InjectFlags.Optional))
        })

        provider = fx(() => {
            inject(provider2)
        })

        expected = null
        spy = fn()
        subject = createFxComponent(
            fx(() => {
                inject(provider)
            }),
        )

        TestBed.configureTestingModule({
            providers: [provider2],
        })

        TestBed.overrideComponent(subject, {
            add: {
                providers: [provider],
            },
        })

        TestBed.createComponent(subject)

        expect(spy).toHaveBeenCalledWith(expected)
    })
})
