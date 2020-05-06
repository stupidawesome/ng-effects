import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { connectable } from "../providers"
import { effect, watchEffect } from "../utils"
import { afterViewInit, onChanges, onInvalidate } from "../connect"
import fn = jest.fn
import Mock = jest.Mock

describe("invalidations", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should invalidate effects", async () => {
        let subject, expected: Mock

        given: expected = fn()
        given: subject = createConnectedComponent(
            connectable((ctx: any) => {
                effect(() => {
                    onInvalidate(expected) // x1
                })
                afterViewInit(() => {
                    effect(() => {
                        onInvalidate(expected) // x1
                    })
                })
                onChanges(() => {
                    onInvalidate(expected) // x1
                })
                watchEffect(() => {
                    void ctx.inputValue
                    onInvalidate(expected) // x1
                })
            }),
        )

        when: {
            subject.detectChanges()
            subject.componentInstance.ngOnChanges({})
            subject.destroy()
        }

        expect(expected).toHaveBeenCalledTimes(4)
    })

    it("should invalidate methods", () => {
        let subject, expected: Mock

        given: expected = fn()
        given: subject = createConnectedComponent()
        given: subject.componentInstance.asyncMethod = function () {
            onInvalidate(expected)
        }

        when: {
            subject.detectChanges()
            subject.componentInstance.asyncMethod()
            subject.componentInstance.asyncMethod() // invalidates previous call
            subject.destroy()
        }

        expect(expected).toHaveBeenCalledTimes(2)
    })
})
