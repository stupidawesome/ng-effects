import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { watch, watchEffect } from "../utils"
import { connectable } from "../providers"
import Mock = jest.Mock
import fn = jest.fn
import { Ref } from "../connect"

describe("watchEffect", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should watch a single source", () => {
        let subject, current: Mock, previous: Mock, connect, ref: Ref<number>

        given: current = fn()
        given: previous = fn()
        given: connect = () => {
            ref = Ref(0)
            watch(ref, (value, prevValue) => {
                current(value)
                previous(prevValue)
            })
        }
        given: subject = createConnectedComponent(connectable(connect))

        when: {
            subject.detectChanges()
            ref!.value = 10
            subject.detectChanges()
        }

        then: expect(current).toHaveBeenCalledTimes(2)
        then: expect(current.mock.calls).toEqual([[0], [10]])
        then: expect(previous.mock.calls).toEqual([[undefined], [0]])
    })

    it("should watch multiple sources", () => {
        let subject,
            current: Mock,
            previous: Mock,
            connect,
            ref1: Ref<number>,
            ref2: Ref<string>,
            ref3: Ref<boolean>

        given: current = fn()
        given: previous = fn()
        given: connect = () => {
            ref1 = Ref(0)
            ref2 = Ref("BOGUS")
            ref3 = Ref(true)

            watch(
                [ref1, ref2, ref3],
                (value, prevValue) => {
                    current(value)
                    previous(prevValue)
                },
                { flush: "sync" },
            )
        }
        given: subject = createConnectedComponent(connectable(connect))

        when: {
            subject.detectChanges() // x1
            ref1!.value = 10 // x1
            ref2!.value = "10" // x1
            ref3!.value = false // x1
        }

        then: expect(current).toHaveBeenCalledTimes(4)
        then: expect(current.mock.calls).toEqual([
            [[0, "BOGUS", true]],
            [[10, "BOGUS", true]],
            [[10, "10", true]],
            [[10, "10", false]],
        ])
        then: expect(previous.mock.calls).toEqual([
            [[]],
            [[0, "BOGUS", true]],
            [[10, "BOGUS", true]],
            [[10, "10", true]],
        ])
    })
})
