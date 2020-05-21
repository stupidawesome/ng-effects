import {
    ConnectedComponent,
    createConnectedComponent,
    declare,
    provide,
} from "./utils"
import {
    afterViewChecked,
    afterViewInit,
    inject,
    onChanges,
    onDestroy,
} from "../connect"
import { connectable } from "../providers"
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing"
import { Observable, timer } from "rxjs"
import { Component, InjectionToken } from "@angular/core"
import { Connectable } from "../connectable.directive"
import { accept, watchEffect } from "../utils"
import { Effect } from "../effect"
import { map } from "rxjs/operators"
import fn = jest.fn
import Mock = jest.Mock

export function detectChangesAfterEach(
    fixture: ComponentFixture<any>,
    values: any[],
) {
    for (const value of values) {
        fixture.componentInstance.fakeProp = value
        fixture.componentInstance.ngOnChanges({})
        fixture.detectChanges()
    }
}

const SPY = new InjectionToken<Mock>("SPY")

@Component({
    template: `
        <div>{{ name }}</div>
        <count></count>
    `,
})
export class ParentComponent extends Connectable {
    name = "bogus"
    ngOnConnect() {
        const spy = inject(SPY)

        watchEffect(() => spy(1))
        onChanges(() => {
            spy(2)
            watchEffect(() => spy(3))
        })
        afterViewInit(() => {
            spy(4)
            watchEffect(() => spy(5))
        })
        afterViewChecked(() => {
            spy(6)
            watchEffect(() => spy(7))
        })
        onDestroy(() => {
            spy(8)
            watchEffect(() => spy(9))
        })
    }
}

@Component({
    selector: "count",
    template: ` {{ count }} `,
})
export class CountComponent extends Connectable {
    count = 0

    incrementCount() {
        this.count += 1
    }

    ngOnConnect() {
        const spy = inject(SPY)

        watchEffect(() => spy(10))
        onChanges(() => {
            spy(11)
            watchEffect(() => spy(12))
        })
        afterViewInit(() => {
            spy(13)
            watchEffect(() => spy(14))
        })
        afterViewChecked(() => {
            spy(15)
            watchEffect(() => spy(16))
        })
        onDestroy(() => {
            spy(17)
            watchEffect(() => spy(18))
        })
    }
}

describe("effect", () => {
    beforeEach(() =>
        declare(ConnectedComponent, ParentComponent, CountComponent),
    )
    beforeEach(() =>
        provide({
            provide: SPY,
            useValue: fn(),
        }),
    )

    it("should execute synchronously", () => {
        let subject, expected: any, connect

        given: expected = fn()
        given: connect = () => {
            watchEffect(expected)
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
            afterViewChecked(expected)
            onDestroy(expected)
        }
        given: subject = createConnectedComponent()
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            subject.detectChanges()
            subject.componentInstance.ngOnChanges({})
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
            onChanges(() => watchEffect(expected)) // x10
            afterViewInit(() => watchEffect(expected)) // x2)
            afterViewChecked(() => watchEffect(expected)) // x10
            onDestroy(() => watchEffect(expected)) // x2
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

        given: expected = fn()
        given: connect = function (this: any, state?: any) {
            watchEffect(() => {
                expected()
                // ngOnConnect receives a reactive `this` context.
                // Connectable functions receive a reactive `state` argument.
                this ? this.fakeProp : state.fakeProp
                return timer(1000).subscribe(() => {
                    throw new Error("Teardown not disposed")
                })
            })
        }
        given: subject = createConnectedComponent(connectable(connect))
        given: subject.componentInstance.ngOnConnect = connect

        when: {
            detectChangesAfterEach(subject, [1, 2, 3, 4, 5])
            subject.destroy()
            tick(10000)
        }

        // called twice for each change detection (5x2)
        then: expect(expected).toHaveBeenCalledTimes(10)
    }))

    it("should call hooks in the right order", () => {
        let subject, expected

        given: expected = TestBed.inject(SPY)
        given: subject = TestBed.createComponent(ParentComponent)

        when: {
            // simulate input change on parent component
            subject.componentInstance.ngOnChanges({})
            subject.detectChanges()
            subject.destroy()
        }

        then: expect(expected.mock.calls).toEqual([
            [1],
            [2],
            [3],
            [10],
            // onChanges only called if inputs change
            // [11],
            // [12],
            [13],
            [14],
            [15],
            [16],
            [4],
            [5],
            [6],
            [7],
            [17],
            [18],
            [8],
            [9],
        ])
    })
})

describe("Effect", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should emit when called like a function", () => {
        let subject, expected

        given: expected = fn()
        given: subject = new Effect()

        when: {
            subject.subscribe(expected)
            subject()
        }

        then: expect(expected).toHaveBeenCalledTimes(1)
    })

    it("should emit single arguments", () => {
        let subject, expected

        given: expected = fn()
        given: subject = new Effect<string>()

        when: {
            subject.subscribe(expected)
            subject("BOGUS")
        }

        then: expect(expected).toHaveBeenCalledWith("BOGUS")
    })

    it("should emit multiple arguments as an array", () => {
        let subject, expected

        given: expected = fn()
        given: subject = new Effect<[string, number]>()

        when: {
            subject.subscribe(expected)
            subject("BOGUS", 1337)
        }

        then: expect(expected).toHaveBeenCalledWith(["BOGUS", 1337])
    })

    it("should use pipeable operators", () => {
        let subject, expected

        given: expected = fn()
        given: subject = new Effect(
            accept<string>(),
            map((value) => +value)
        )

        when: {
            subject.subscribe(expected)
            subject("1337")
        }

        then: expect(expected).toHaveBeenCalledWith(1337)
    })
})
