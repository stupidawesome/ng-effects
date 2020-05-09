import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import { connectable } from "../providers"
import { effect, watchEffect } from "../utils"
import { afterViewInit, onChanges } from "../connect"
import fn = jest.fn
import Mock = jest.Mock

describe("invalidations", () => {
    beforeEach(() => declare(ConnectedComponent))

    it("should invalidate effects", () => {
        let subject, expected: Mock

        given: expected = fn()
        given: subject = createConnectedComponent(
            connectable((ctx: any) => {
                effect((onInvalidate) => {
                    onInvalidate(expected) // x1
                })
                afterViewInit(() => {
                    effect((onInvalidate) => {
                        onInvalidate(expected) // x1
                    })
                })
                onChanges(() => {
                    effect((onInvalidate) => {
                        onInvalidate(expected) // x2
                    })
                })
                watchEffect((onInvalidate) => {
                    void ctx.inputValue
                    onInvalidate(expected) // x2
                })
            }),
        )

        when: {
            subject.detectChanges() // effect x1 watchEffect x1 afterViewInit x1
            subject.componentInstance.ngOnChanges({}) // onChanges x1
            subject.componentInstance.ngOnChanges({}) // onChanges x1
            subject.componentInstance.inputValue = 10
            subject.detectChanges() // watchEffect x1
            subject.destroy()
        }

        expect(expected).toHaveBeenCalledTimes(6)
    })
})
