import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { $, Computed, reactive } from "../utils"
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

    it("should chain compute values and recalculate when any dependency changes", () => {
        let subject: any, expected, a: any, b: any, c: any, spy: Mock

        given: spy = fn()
        given: createConnectedComponent()
        given: subject = reactive({ value: 10, bogus: "BOGUS" })
        given: a = $(() => {
            spy()
            return subject.value * 2
        })
        given: b = $(() => {
            spy()
            subject.bogus
            return 20
        })
        given: c = $(() => {
            spy()
            return a() * 2 + b()
        })

        when: {
            c() // ax1 bx1 cx1
            c()
            expected = c()
            then: expect(expected).toBe(60)
            then: expect(spy).toHaveBeenCalledTimes(3)

            subject.value = 20
            c() // ax1 bx0 cx1
            c()
            subject.bogus = "bogus"
            c() // ax0 bx1 cx1
            c()
            expected = c()
        }

        then: expect(spy).toHaveBeenCalledTimes(7)
        then: expect(expected).toBe(100)
    })
})
