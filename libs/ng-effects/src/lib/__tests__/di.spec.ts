import { ConnectedComponent, createConnectedComponent, declare, provide } from "./utils"
import { inject } from "../connect"
import { connectable } from "../providers"
import {
    Component,
    Inject,
    InjectFlags,
    InjectionToken,
    Injector,
    INJECTOR,
    ViewContainerRef,
} from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { Connectable } from "../connectable.directive"

const TEST = new InjectionToken("TEST")

@Component({
    selector: "di",
    template: ``,
})
export class DI extends Connectable {
    ngOnConnect() {
        expect(() => inject(DI, InjectFlags.SkipSelf)).toThrow()
        expect(inject(DI, InjectFlags.SkipSelf | InjectFlags.Optional)).toBe(null)
        expect(inject(DI, InjectFlags.Self)).toBeInstanceOf(DI)
        expect(() => inject(TEST, InjectFlags.Self)).toThrow()
        expect(inject(TEST, InjectFlags.Self | InjectFlags.Optional)).toBe(null)
        expect(inject(TEST, InjectFlags.Default)).toBe("TEST")
        expect(inject(DI, InjectFlags.Host)).toBeInstanceOf(DI)
    }

    constructor(@Inject(INJECTOR) injector: Injector, viewContainerRef: ViewContainerRef) {
        super(injector)
    }
}

describe("lifecycle hooks", () => {
    beforeEach(() => declare(ConnectedComponent, DI))

    it(`should execute connected callbacks inside an injection context`, async () => {
        let subject, expected: any, connect

        given: expected = ConnectedComponent
        given: connect = () => {
            expect(inject(expected)).toBeInstanceOf(expected)
        }
        given: subject = createConnectedComponent(connectable(connect))
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            subject.detectChanges()
            await subject.whenRenderingDone()
        }

        expect.assertions(2)
    })

    it("should respect injector flags", () => {
        let subject

        given: provide({
            provide: TEST,
            useValue: "TEST",
        })
        given: subject = TestBed.createComponent(DI)

        when: subject.detectChanges()

        then: expect.assertions(7)
    })
})
