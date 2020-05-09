import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { connectable } from "../providers"
import { watchEffect } from "../utils"
import { afterContentChecked, afterViewChecked } from "../connect"
import fn = jest.fn
import Mock = jest.Mock

describe("watchEffect", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should flush effects synchronously", () => {
        let subject, expected: Mock, connect

        given: expected = fn()
        given: connect = (ctx: ConnectedComponent) => {
            watchEffect(
                (onInvalidate) => {
                    void ctx.inputValue
                    onInvalidate(expected)
                },
                { flush: "sync" },
            )
        }
        given: subject = createConnectedComponent(connectable(connect))

        when: {
            subject.detectChanges()
            subject.componentInstance.inputValue = 20
            subject.componentInstance.inputValue = 30
        }

        then: expect(expected).toHaveBeenCalledTimes(2)
    })

    it("should flush effects before the component updates", () => {
        let subject, expected: Mock, connect

        given: expected = fn()
        given: connect = (ctx: ConnectedComponent) => {
            afterContentChecked(() => expected(1))

            watchEffect(
                (onInvalidate) => {
                    void ctx.inputValue
                    onInvalidate(() => expected(2))
                },
                { flush: "pre" },
            )

            afterViewChecked(() => expected(3))
        }
        given: subject = createConnectedComponent(connectable(connect))

        when: {
            subject.detectChanges() // [1, 3]
            subject.componentInstance.inputValue = 10
            subject.detectChanges() // [1, 2, 3]
            subject.componentInstance.inputValue = 20
            subject.detectChanges() // [1, 2, 3]
        }

        then: expect(expected.mock.calls).toEqual([
            [1],
            [3],
            [1],
            [2],
            [3],
            [1],
            [2],
            [3],
        ])
    })

    it("should flush effects after the component updates", () => {
        let subject, expected: Mock, connect

        given: expected = fn()
        given: connect = (ctx: ConnectedComponent) => {
            afterContentChecked(() => expected(1))

            afterViewChecked(() => expected(2))

            watchEffect(
                (onInvalidate) => {
                    void ctx.inputValue
                    onInvalidate(() => expected(3))
                },
                { flush: "post" },
            )

            watchEffect((onInvalidate) => {
                void ctx.inputValue
                onInvalidate(() => expected(4))
            })
        }
        given: subject = createConnectedComponent(connectable(connect))

        when: {
            subject.detectChanges() // [1, 2]
            subject.componentInstance.inputValue = 10
            subject.detectChanges() // [1, 2, 3, 4]
            subject.componentInstance.inputValue = 20
            subject.detectChanges() // [1, 2, 3, 4]
        }

        then: expect(expected.mock.calls).toEqual([
            [1],
            [2],
            [1],
            [2],
            [3],
            [4],
            [1],
            [2],
            [3],
            [4],
        ])
    })
})
