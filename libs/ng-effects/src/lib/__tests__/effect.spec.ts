import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { inject } from "../connect"
import { connectable } from "../providers"
import { afterViewInit, effect, onChanges, onDestroy, whenRendered } from "../hooks"
import fn = jest.fn
import { ComponentFixture, fakeAsync, tick } from "@angular/core/testing"
import { timer } from "rxjs"

export function detectChangesAfterEach(fixture: ComponentFixture<any>, values: any[]) {
    for (const value of values) {
        fixture.componentInstance.fakeProp = value
        fixture.detectChanges()
    }
}

describe("effect", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should execute synchronously", () => {
        let subject, expected: any, connect

        given: expected = fn()
        given: connect = () => {
            effect(expected)
        }
        given: subject = createConnectedComponent()
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            subject.detectChanges()
        }

        then: expect(expected).toHaveBeenCalledTimes(1)
    })

    it("should execute inside lifecycle hooks", () => {
        let subject, expected: any, connect

        given: expected = fn()
        given: connect = () => {
            onChanges(expected)
            afterViewInit(expected)
            whenRendered(expected)
            onDestroy(expected)
        }
        given: subject = createConnectedComponent()
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            subject.detectChanges()
            subject.destroy()
        }

        then: expect(expected).toHaveBeenCalledTimes(4)
    })

    it("should flush effects each time a lifecycle hook is called", fakeAsync(() => {
        let subject, expected: any, connect

        given: expected = fn(() =>
            timer(1000).subscribe(() => {
                throw new Error("Teardown not disposed")
            }),
        )
        given: connect = () => {
            onChanges(() => effect(expected)) // x10
            afterViewInit(() => effect(expected)) // x2)
            whenRendered(() => effect(expected)) // x10
            onDestroy(() => effect(expected)) // x2
        }
        given: subject = createConnectedComponent(connectable(connect))
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            detectChangesAfterEach(subject, [1, 2, 3, 4, 5])
            subject.destroy()
            tick(10000)
        }

        then: expect(expected).toHaveBeenCalledTimes(24)
    }))

    it("should flush effects when reactive dependencies change", fakeAsync(() => {
        let subject, expected: any, connect

        given: expected = fn(function(this: any, state: any) {
            // ngOnConnect receives a reactive `this` context.
            // Connectable functions receive a reactive `state` argument.
            void this ? this.fakeProp : state.fakeProp
            return timer(1000).subscribe(() => {
                throw new Error("Teardown not disposed")
            })
        })
        given: connect = () => effect(expected)
        given: subject = createConnectedComponent(connectable(connect))
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            detectChangesAfterEach(subject, [1, 2, 3, 4, 5])
            subject.destroy()
            tick(10000)
        }

        then: expect(expected).toHaveBeenCalledTimes(24)
    }))
})
