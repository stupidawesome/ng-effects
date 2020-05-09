import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { $, Computed } from "../utils"
import { ComponentFixture } from "@angular/core/testing"
import fn = jest.fn
import Mock = jest.Mock

describe("lifecycle hooks", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should get compute values", () => {
        let subject: ComponentFixture<ConnectedComponent>, expected, values

        given: values = [0, 10, 15]
        given: subject = createConnectedComponent()
        given: subject.componentInstance.inputValue = 10
        given: subject.componentInstance.computed = $(
            () => subject.componentInstance.inputValue * 2,
        )

        for (const value of values) {
            when: {
                subject.componentInstance.inputValue = value
                expected = subject.componentInstance.computed()
            }

            then: expect(expected).toBe(value * 2)
        }
    })

    it("should set computed values", () => {
        let subject: ComponentFixture<ConnectedComponent>,
            expected,
            computed,
            values

        given: values = [0, 10, 15]
        given: subject = createConnectedComponent()
        given: subject.componentInstance.inputValue = 10
        given: computed = new Computed(
            (value = 0) => subject.componentInstance.inputValue * 2 + value,
        )
        given: subject.componentInstance.computed = computed

        for (const value of values) {
            when: {
                subject.componentInstance.inputValue = value
                expected = computed(value)
            }

            then: expect(expected).toBe(value * 2 + value)
        }
    })

    it("shouldn't recompute values", () => {
        let subject: ComponentFixture<ConnectedComponent>,
            expected: Mock,
            computed

        given: expected = fn()
        given: subject = createConnectedComponent()
        given: subject.componentInstance.inputValue = 10
        given: computed = Computed((multiplier = 1) => {
            expected()
            return subject.componentInstance.inputValue * multiplier
        })
        given: subject.componentInstance.computed = computed

        when: {
            const inst = subject.componentInstance
            computed() // x1
            computed() // no change
            computed(2) // x1
            computed(2) // no change
            inst.inputValue = 20
            computed(2) // x1
            computed(2) // no change
            computed() // x1
        }

        then: expect(expected).toHaveBeenCalledTimes(4)
    })
})
