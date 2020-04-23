import { ConnectedComponent, createConnectedComponent, declare } from "./utils"
import fn = jest.fn
import Mock = jest.Mock
import { inject } from "../connect"
import { connectable } from "../providers"

describe("lifecycle hooks", () => {
    beforeEach(() => declare(ConnectedComponent))

    it(`should execute connected callbacks inside an injection context`, async () => {
        let subject, expected: any, result, connect

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
})
